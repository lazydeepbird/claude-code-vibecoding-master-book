'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiMessage, ChatMessage, Conversation } from '@/types/chat';

const STORAGE_KEY = 'ai-chat-conversations';
const TITLE_MAX = 30;

const uid = () => crypto.randomUUID();

const makeTitle = (text: string): string => {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > TITLE_MAX ? `${oneLine.slice(0, TITLE_MAX)}…` : oneLine;
};

const loadFromStorage = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
};

const toApiMessages = (messages: ChatMessage[], extra?: ChatMessage): ApiMessage[] =>
  (extra ? [...messages, extra] : messages).map((m) => ({
    role: m.role,
    content: m.content,
  }));

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // 비동기 스트리밍 중 최신 상태를 읽기 위한 ref 미러
  const conversationsRef = useRef(conversations);
  const activeIdRef = useRef(activeId);
  const isStreamingRef = useRef(isStreaming);
  const loadedRef = useRef(false);

  conversationsRef.current = conversations;
  activeIdRef.current = activeId;
  isStreamingRef.current = isStreaming;

  // 최초 마운트: localStorage / 다크모드 초기 로드
  useEffect(() => {
    const stored = loadFromStorage();
    setConversations(stored);
    setActiveId(stored.length > 0 ? stored[0].id : null);
    setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    loadedRef.current = true;
  }, []);

  // 변경 시 영속
  useEffect(() => {
    if (!loadedRef.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // 다크모드 클래스 토글
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const appendToAssistant = useCallback(
    (convId: string, msgId: string, chunk: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === msgId ? { ...m, content: m.content + chunk } : m
                ),
              }
            : c
        )
      );
    },
    []
  );

  const newConversation = useCallback(() => {
    const now = Date.now();
    const conv: Conversation = {
      id: uid(),
      title: '새 대화',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveId((current) =>
        current === id ? (next.length > 0 ? next[0].id : null) : current
      );
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setConversations([]);
    setActiveId(null);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreamingRef.current) return;

      const now = Date.now();
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        createdAt: now,
      };
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: now + 1,
      };

      let convId = activeIdRef.current;
      let history: ApiMessage[];

      if (!convId) {
        convId = uid();
        const conv: Conversation = {
          id: convId,
          title: makeTitle(trimmed),
          messages: [userMsg, assistantMsg],
          createdAt: now,
          updatedAt: now,
        };
        history = toApiMessages([userMsg]);
        setConversations((prev) => [conv, ...prev]);
        setActiveId(convId);
      } else {
        const existing = conversationsRef.current.find((c) => c.id === convId);
        const prevMsgs = existing ? existing.messages : [];
        history = toApiMessages(prevMsgs, userMsg);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? makeTitle(trimmed) : c.title,
                  messages: [...c.messages, userMsg, assistantMsg],
                  updatedAt: now,
                }
              : c
          )
        );
      }

      setIsStreaming(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => '');
          throw new Error(detail || `요청 실패 (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) appendToAssistant(convId, assistantMsg.id, chunk);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        appendToAssistant(convId, assistantMsg.id, `\n\n_오류: ${msg}_`);
      } finally {
        setIsStreaming(false);
      }
    },
    [appendToAssistant]
  );

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  return {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    darkMode,
    newConversation,
    selectConversation,
    deleteConversation,
    clearAll,
    sendMessage,
    toggleDarkMode,
  };
};
