'use client';

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Header({ darkMode, onToggleDark }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <h1 className="text-lg font-semibold">AI Chat</h1>
      <button
        onClick={onToggleDark}
        aria-label="다크 모드 전환"
        className="rounded-md px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {darkMode ? '☀️ 라이트' : '🌙 다크'}
      </button>
    </header>
  );
}
