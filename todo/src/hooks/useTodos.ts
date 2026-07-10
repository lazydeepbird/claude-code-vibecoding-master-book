import { useState, useEffect, useCallback } from 'react';
import type { Todo, FilterType, Priority } from '../types/todo';

const STORAGE_KEY = 'todo-app-items';

const loadFromStorage = (): Todo[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>(loadFromStorage);
  const [filter, setFilter] = useState<FilterType>('all');
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const addTodo = useCallback((text: string, priority: Priority = 'medium') => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos(prev => [
      {
        id: crypto.randomUUID(),
        text: trimmed,
        completed: false,
        priority,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, text: trimmed } : t))
    );
  }, []);

  const changePriority = useCallback((id: string, priority: Priority) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, priority } : t))
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed));
  }, []);

  const toggleAll = useCallback(() => {
    const allCompleted = todos.every(t => t.completed);
    setTodos(prev => prev.map(t => ({ ...t, completed: !allCompleted })));
  }, [todos]);

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  return {
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
  };
};
