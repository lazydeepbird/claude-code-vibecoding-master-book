import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChat } from './useChat';

const STORAGE_KEY = 'ai-chat-conversations';

// CLAUDE.md 규칙: localStorage / matchMedia 는 mock 으로 대체한다.
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();

/**
 * 청크 배열을 스트리밍으로 흘려보내는 가짜 fetch 응답.
 * useChat 은 res.ok / res.body.getReader() / res.text() 만 사용한다.
 */
const makeStreamResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
  return { ok: true, status: 200, body, text: async () => '' };
};

const mockFetchWith = (chunks: string[]) => {
  const fn = vi.fn(() => Promise.resolve(makeStreamResponse(chunks)));
  vi.stubGlobal('fetch', fn);
  return fn;
};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: storageMock, configurable: true });
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: false }),
    configurable: true,
  });
  storageMock.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useChat', () => {
  it('새 대화를 만들면 목록에 추가되고 활성 대화가 된다', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.newConversation();
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.activeId).toBe(result.current.conversations[0].id);
  });

  it('빈 문자열(공백만) 입력 시 대화를 만들지 않고 요청도 보내지 않는다', async () => {
    const fetchFn = mockFetchWith(['무시됨']);
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.conversations).toHaveLength(0);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('메시지를 보내면 user/assistant 메시지가 추가되고 스트리밍 텍스트가 누적된다', async () => {
    const parts = ['안녕', '하세', '요!'];
    mockFetchWith(parts);
    const { result } = renderHook(() => useChat());

    const input = '반가워';
    await act(async () => {
      await result.current.sendMessage(input);
    });

    const conv = result.current.activeConversation;
    expect(conv).not.toBeNull();
    expect(conv!.messages).toHaveLength(2);

    const [userMsg, assistantMsg] = conv!.messages;
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe(input);
    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.content).toBe(parts.join(''));
  });

  it('첫 메시지 내용으로 대화 제목이 설정된다', async () => {
    mockFetchWith(['응답']);
    const { result } = renderHook(() => useChat());

    const input = '오늘 날씨 어때';
    await act(async () => {
      await result.current.sendMessage(input);
    });

    expect(result.current.activeConversation!.title).toBe(input);
  });

  it('대화를 삭제하면 목록에서 제거된다', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.newConversation();
    });
    const id = result.current.conversations[0].id;

    act(() => {
      result.current.deleteConversation(id);
    });

    expect(result.current.conversations.find((c) => c.id === id)).toBeUndefined();
    expect(result.current.conversations).toHaveLength(0);
  });

  it('전체 초기화하면 모든 대화가 비워진다', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.newConversation();
      result.current.newConversation();
    });
    expect(result.current.conversations.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.conversations).toHaveLength(0);
    expect(result.current.activeId).toBeNull();
  });

  it('보낸 대화가 localStorage 에 저장된다', async () => {
    mockFetchWith(['저장 확인']);
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('저장돼야 함');
    });

    const raw = storageMock.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved).toHaveLength(result.current.conversations.length);
    expect(saved[0].messages).toHaveLength(2);
  });
});
