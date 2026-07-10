import { ClipboardList } from 'lucide-react';
import type { Todo, Priority } from '../types/todo';
import { TodoItem } from './TodoItem';

interface Props {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onChangePriority: (id: string, priority: Priority) => void;
  onToggleAll: () => void;
  allCompleted: boolean;
}

export const TodoList = ({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onChangePriority,
  onToggleAll,
  allCompleted,
}: Props) => {
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
        <ClipboardList size={48} strokeWidth={1} className="mb-3" />
        <p className="text-sm">할 일이 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      {/* 전체 완료 토글 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <button
          onClick={onToggleAll}
          className={`text-xs px-3 py-1 rounded-full border transition-all duration-200
                      ${allCompleted
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300'
                      }`}
          aria-label="전체 완료 토글"
        >
          {allCompleted ? '전체 완료 취소' : '전체 완료'}
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto">
          더블클릭으로 편집
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onChangePriority={onChangePriority}
          />
        ))}
      </ul>
    </div>
  );
};
