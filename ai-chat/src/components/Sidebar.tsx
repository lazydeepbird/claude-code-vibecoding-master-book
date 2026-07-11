'use client';

import type { Conversation } from '@/types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
}: SidebarProps) {
  const handleClearAll = () => {
    if (conversations.length === 0) return;
    if (window.confirm('모든 대화를 삭제할까요? 되돌릴 수 없습니다.')) {
      onClearAll();
    }
  };

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 새 대화
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 && (
          <li className="px-2 py-4 text-sm text-gray-400">대화가 없습니다.</li>
        )}
        {conversations.map((c) => (
          <li key={c.id}>
            <div
              className={`group flex items-center justify-between rounded-md px-2 py-2 text-sm ${
                c.id === activeId
                  ? 'bg-blue-100 dark:bg-blue-900/40'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex-1 truncate text-left"
                title={c.title}
              >
                {c.title || '새 대화'}
              </button>
              <button
                onClick={() => onDelete(c.id)}
                aria-label="대화 삭제"
                className="ml-2 hidden text-gray-400 hover:text-red-500 group-hover:block"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <button
          onClick={handleClearAll}
          disabled={conversations.length === 0}
          className="w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:hover:bg-red-900/30 dark:disabled:text-gray-600"
        >
          전체 초기화
        </button>
      </div>
    </aside>
  );
}
