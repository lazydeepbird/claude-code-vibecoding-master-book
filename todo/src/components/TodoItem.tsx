import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Trash2, Check, Pencil } from 'lucide-react';
import type { Todo, Priority } from '../types/todo';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onChangePriority: (id: string, priority: Priority) => void;
}

const priorityConfig: Record<Priority, { dot: string; border: string }> = {
  high: { dot: 'bg-red-400', border: 'border-l-red-400' },
  medium: { dot: 'bg-yellow-400', border: 'border-l-yellow-400' },
  low: { dot: 'bg-blue-400', border: 'border-l-blue-400' },
};

export const TodoItem = ({ todo, onToggle, onDelete, onEdit, onChangePriority }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) editRef.current?.focus();
  }, [isEditing]);

  const commitEdit = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  const config = priorityConfig[todo.priority];

  return (
    <li
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                  border-l-4 ${config.border}
                  shadow-sm hover:shadow-md transition-all duration-200 todo-item`}
    >
      {/* 완료 체크버튼 */}
      <button
        onClick={() => onToggle(todo.id)}
        className={`checkbox-custom flex-shrink-0 ${todo.completed ? 'checked' : ''}`}
        aria-label={todo.completed ? '완료 취소' : '완료 처리'}
      >
        {todo.completed && <Check size={12} strokeWidth={3} className="text-white" />}
      </button>

      {/* 텍스트 / 편집 인풋 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editRef}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-b border-indigo-400 focus:outline-none
                       text-sm text-gray-800 dark:text-gray-200"
          />
        ) : (
          <span
            onDoubleClick={() => setIsEditing(true)}
            className={`block truncate text-sm cursor-default select-none
                        ${todo.completed
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : 'text-gray-800 dark:text-gray-200'
                        }`}
            title={todo.text}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* 우선순위 점 - 클릭으로 순환 변경 */}
      <button
        onClick={() => {
          const order: Priority[] = ['low', 'medium', 'high'];
          const next = order[(order.indexOf(todo.priority) + 1) % order.length];
          onChangePriority(todo.id, next);
        }}
        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${config.dot}
                    hover:scale-150 transition-transform duration-150 cursor-pointer`}
        title={`우선순위: ${todo.priority} (클릭하여 변경)`}
        aria-label="우선순위 변경"
      />

      {/* 액션 버튼 - hover 시에만 표시 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400
                     transition-colors duration-150"
          aria-label="편집"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400
                     transition-colors duration-150"
          aria-label="삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
};
