import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTodos } from './useTodos';
import type { Priority, Todo } from '../types/todo';

// ─── localStorage mock ────────────────────────────────────────────────────────

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

const storageMock = createStorageMock();

// ─── 테스트 fixture ───────────────────────────────────────────────────────────

const TEXT = {
  first: '첫 번째 할 일',
  second: '두 번째 할 일',
  edited: '수정된 할 일',
  whitespaceOnly: '   ',
  empty: '',
};

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: crypto.randomUUID(),
  text: TEXT.first,
  completed: false,
  priority: 'medium',
  createdAt: Date.now(),
  ...overrides,
});

const seedStorage = (todos: Todo[]) => {
  storageMock.setItem('todo-app-items', JSON.stringify(todos));
};

// ─── 공통 setup ───────────────────────────────────────────────────────────────

beforeEach(() => {
  storageMock.clear();
  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
    writable: true,
  });
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue({ matches: false }),
    writable: true,
  });
});

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('useTodos', () => {

  describe('addTodo', () => {
    it('할 일을 목록 맨 앞에 추가한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));

      expect(result.current.todos[0].text).toBe(TEXT.second);
      expect(result.current.todos[1].text).toBe(TEXT.first);
    });

    it('빈 문자열 입력 시 추가하지 않는다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => result.current.addTodo(TEXT.empty));

      expect(result.current.todos).toHaveLength(0);
    });

    it('공백만 있는 문자열 입력 시 추가하지 않는다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => result.current.addTodo(TEXT.whitespaceOnly));

      expect(result.current.todos).toHaveLength(0);
    });

    it('앞뒤 공백을 제거한 텍스트로 저장한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => result.current.addTodo(`  ${TEXT.first}  `));

      expect(result.current.todos[0].text).toBe(TEXT.first);
    });

    it('우선순위를 지정하지 않으면 medium으로 추가된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => result.current.addTodo(TEXT.first));

      expect(result.current.todos[0].priority).toBe('medium');
    });

    it('지정한 우선순위로 추가된다', () => {
      const { result } = renderHook(() => useTodos());
      const priority: Priority = 'high';

      act(() => result.current.addTodo(TEXT.first, priority));

      expect(result.current.todos[0].priority).toBe(priority);
    });
  });

  describe('toggleTodo', () => {
    it('미완료 항목을 완료 상태로 변경한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      const id = result.current.todos[0].id;

      act(() => result.current.toggleTodo(id));

      expect(result.current.todos[0].completed).toBe(true);
    });

    it('완료 항목을 미완료 상태로 변경한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      const id = result.current.todos[0].id;
      act(() => result.current.toggleTodo(id));

      act(() => result.current.toggleTodo(id));

      expect(result.current.todos[0].completed).toBe(false);
    });

    it('대상 항목만 상태가 바뀌고 나머지는 그대로다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      const targetId = result.current.todos[0].id;

      act(() => result.current.toggleTodo(targetId));

      const untouched = result.current.todos.find(t => t.id !== targetId)!;
      expect(untouched.completed).toBe(false);
    });
  });

  describe('deleteTodo', () => {
    it('지정한 id의 항목을 삭제한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      const id = result.current.todos[0].id;

      act(() => result.current.deleteTodo(id));

      expect(result.current.todos.find(t => t.id === id)).toBeUndefined();
    });

    it('삭제 후 나머지 항목은 유지된다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      const deleteId = result.current.todos[0].id;

      act(() => result.current.deleteTodo(deleteId));

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe(TEXT.first);
    });
  });

  describe('editTodo', () => {
    it('지정한 항목의 텍스트를 수정한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      const id = result.current.todos[0].id;

      act(() => result.current.editTodo(id, TEXT.edited));

      expect(result.current.todos[0].text).toBe(TEXT.edited);
    });

    it('빈 문자열로 수정 시 기존 텍스트를 유지한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      const id = result.current.todos[0].id;

      act(() => result.current.editTodo(id, TEXT.empty));

      expect(result.current.todos[0].text).toBe(TEXT.first);
    });

    it('공백만 있는 문자열로 수정 시 기존 텍스트를 유지한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      const id = result.current.todos[0].id;

      act(() => result.current.editTodo(id, TEXT.whitespaceOnly));

      expect(result.current.todos[0].text).toBe(TEXT.first);
    });
  });

  describe('changePriority', () => {
    it('지정한 항목의 우선순위를 변경한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first, 'low'));
      const id = result.current.todos[0].id;

      act(() => result.current.changePriority(id, 'high'));

      expect(result.current.todos[0].priority).toBe('high');
    });

    it('우선순위 변경은 해당 항목에만 적용된다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first, 'low'));
      act(() => result.current.addTodo(TEXT.second, 'low'));
      const targetId = result.current.todos[0].id;

      act(() => result.current.changePriority(targetId, 'high'));

      const untouched = result.current.todos.find(t => t.id !== targetId)!;
      expect(untouched.priority).toBe('low');
    });
  });

  describe('clearCompleted', () => {
    it('완료된 항목만 삭제한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      const completedId = result.current.todos[0].id;
      act(() => result.current.toggleTodo(completedId));

      act(() => result.current.clearCompleted());

      expect(result.current.todos.every(t => !t.completed)).toBe(true);
    });

    it('미완료 항목은 clearCompleted 후에도 유지된다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      const completedId = result.current.todos[0].id;
      act(() => result.current.toggleTodo(completedId));

      act(() => result.current.clearCompleted());

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].completed).toBe(false);
    });
  });

  describe('toggleAll', () => {
    it('모두 미완료인 경우 전체를 완료로 변경한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));

      act(() => result.current.toggleAll());

      expect(result.current.todos.every(t => t.completed)).toBe(true);
    });

    it('모두 완료인 경우 전체를 미완료로 변경한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      act(() => result.current.toggleAll());

      act(() => result.current.toggleAll());

      expect(result.current.todos.every(t => !t.completed)).toBe(true);
    });

    it('일부만 완료인 경우 전체를 완료로 변경한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      act(() => result.current.toggleTodo(result.current.todos[0].id));

      act(() => result.current.toggleAll());

      expect(result.current.todos.every(t => t.completed)).toBe(true);
    });
  });

  describe('필터링', () => {
    const setupMixedTodos = (result: ReturnType<typeof renderHook<ReturnType<typeof useTodos>, unknown>>['result']) => {
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      act(() => result.current.toggleTodo(result.current.todos[0].id));
    };

    it('active 필터는 미완료 항목만 반환한다', () => {
      const { result } = renderHook(() => useTodos());
      setupMixedTodos(result);

      act(() => result.current.setFilter('active'));

      expect(result.current.filteredTodos.every(t => !t.completed)).toBe(true);
      expect(result.current.filteredTodos).toHaveLength(result.current.activeCount);
    });

    it('completed 필터는 완료 항목만 반환한다', () => {
      const { result } = renderHook(() => useTodos());
      setupMixedTodos(result);

      act(() => result.current.setFilter('completed'));

      expect(result.current.filteredTodos.every(t => t.completed)).toBe(true);
      expect(result.current.filteredTodos).toHaveLength(result.current.completedCount);
    });

    it('all 필터는 전체 항목을 반환한다', () => {
      const { result } = renderHook(() => useTodos());
      setupMixedTodos(result);
      act(() => result.current.setFilter('completed'));

      act(() => result.current.setFilter('all'));

      expect(result.current.filteredTodos).toHaveLength(result.current.todos.length);
    });
  });

  describe('activeCount / completedCount', () => {
    it('추가·완료 작업 이후 카운트가 실제 목록과 일치한다', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo(TEXT.first));
      act(() => result.current.addTodo(TEXT.second));
      act(() => result.current.toggleTodo(result.current.todos[0].id));

      const expectedActive = result.current.todos.filter(t => !t.completed).length;
      const expectedCompleted = result.current.todos.filter(t => t.completed).length;

      expect(result.current.activeCount).toBe(expectedActive);
      expect(result.current.completedCount).toBe(expectedCompleted);
    });
  });

  describe('localStorage 영속성', () => {
    it('할 일 추가 시 localStorage에 저장된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => result.current.addTodo(TEXT.first));

      const saved: Todo[] = JSON.parse(storageMock.getItem('todo-app-items')!);
      expect(saved).toHaveLength(1);
      expect(saved[0].text).toBe(TEXT.first);
    });

    it('초기 마운트 시 localStorage에 저장된 데이터를 복원한다', () => {
      const persisted = [makeTodo({ text: TEXT.first }), makeTodo({ text: TEXT.second })];
      seedStorage(persisted);

      const { result } = renderHook(() => useTodos());

      expect(result.current.todos).toHaveLength(persisted.length);
      expect(result.current.todos.map(t => t.text)).toEqual(persisted.map(t => t.text));
    });

    it('localStorage 값이 깨진 JSON이면 빈 배열로 초기화한다', () => {
      storageMock.setItem('todo-app-items', 'invalid-json{{');

      const { result } = renderHook(() => useTodos());

      expect(result.current.todos).toHaveLength(0);
    });
  });
});
