import { useState, useRef, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Priority } from '../types/todo';

interface Props {
  onAdd: (text: string, priority: Priority) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '높음', color: 'text-red-500' },
  { value: 'medium', label: '보통', color: 'text-yellow-500' },
  { value: 'low', label: '낮음', color: 'text-blue-400' },
];

export const TodoInput = ({ onAdd }: Props) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text, priority);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex gap-2 mb-6">
      <select
        value={priority}
        onChange={e => setPriority(e.target.value as Priority)}
        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 text-sm cursor-pointer
                   focus:outline-none focus:ring-2 focus:ring-indigo-400
                   transition-colors duration-200"
        aria-label="우선순위 선택"
      >
        {priorityOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="할 일을 입력하세요..."
        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                   transition-all duration-200"
        aria-label="새 할 일 입력"
        autoFocus
      />

      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300
                   dark:disabled:bg-gray-700 text-white rounded-xl
                   flex items-center gap-1 font-medium text-sm
                   transition-all duration-200 disabled:cursor-not-allowed
                   active:scale-95"
        aria-label="할 일 추가"
      >
        <Plus size={18} />
        추가
      </button>
    </div>
  );
};
