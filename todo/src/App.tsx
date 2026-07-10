import { Moon, Sun, CheckSquare } from 'lucide-react';
import { useTodos } from './hooks/useTodos';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoFooter } from './components/TodoFooter';

function App() {
  const {
    todos,
    filteredTodos,
    filter,
    darkMode,
    activeCount,
    completedCount,
    setFilter,
    setDarkMode,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    changePriority,
    clearCompleted,
    toggleAll,
  } = useTodos();

  const allCompleted = todos.length > 0 && todos.every(t => t.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50
                    dark:from-gray-950 dark:via-gray-900 dark:to-gray-950
                    flex items-start justify-center pt-16 px-4 pb-16">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <CheckSquare size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">TODO</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {todos.length > 0
                  ? `총 ${todos.length}개 · ${completedCount}개 완료`
                  : '오늘 할 일을 추가하세요'}
              </p>
            </div>
          </div>

          {/* 다크모드 토글 */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 flex items-center justify-center
                       text-gray-500 dark:text-gray-400 hover:text-indigo-500
                       dark:hover:text-indigo-400 transition-all duration-200
                       shadow-sm hover:shadow-md"
            aria-label={darkMode ? '라이트 모드' : '다크 모드'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                        rounded-2xl shadow-xl border border-white dark:border-gray-700
                        p-6">
          <TodoInput onAdd={addTodo} />
          <TodoList
            todos={filteredTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            onChangePriority={changePriority}
            onToggleAll={toggleAll}
            allCompleted={allCompleted}
          />
          {todos.length > 0 && (
            <TodoFooter
              activeCount={activeCount}
              completedCount={completedCount}
              filter={filter}
              onFilterChange={setFilter}
              onClearCompleted={clearCompleted}
            />
          )}
        </div>

        {/* 우선순위 범례 */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            높음
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            보통
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            낮음
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
