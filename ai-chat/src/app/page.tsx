'use client';

import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';

export default function Page() {
  const {
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
  } = useChat();

  return (
    <div className="flex h-full">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        onClearAll={clearAll}
      />
      <main className="flex flex-1 flex-col">
        <Header darkMode={darkMode} onToggleDark={toggleDarkMode} />
        <MessageList conversation={activeConversation} isStreaming={isStreaming} />
        <MessageInput onSend={sendMessage} disabled={isStreaming} />
      </main>
    </div>
  );
}
