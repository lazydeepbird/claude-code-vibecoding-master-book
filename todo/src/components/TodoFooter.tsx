import type { FilterType } from '../types/todo';

interface Props {
  activeCount: number;
  completedCount: number;
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  onClearCompleted: () => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'completed', label: '완료' },
];

export const TodoFooter = ({
  activeCount,
  completedCount,
  filter,
  onFilterChange,
  onClearCompleted,
}: Props) => {
  return (
    <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
      {/* 남은 항목 수 */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {activeCount}개 남음
      </span>

      {/* 필터 탭 */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200
                        ${filter === f.value
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
            aria-current={filter === f.value ? 'page' : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 완료 항목 삭제 */}
      <button
        onClick={onClearCompleted}
        disabled={completedCount === 0}
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400
                   disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-200"
      >
        완료 항목 삭제 ({completedCount})
      </button>
    </div>
  );
};
