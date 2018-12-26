import { useState, useCleanup, useEffect } from 'solid-js';

const LOCAL_STORAGE_KEY = 'todos-solid';

function useLocal(_) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY),
    [state, setState] = _;
  if (stored) setState(JSON.parse(stored));

  // JSON.stringify creates deps on every iterable field
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  });
  return _;
}

export default () => {
  const [state, setState] = useLocal(useState({counter: 0, edittingTodoId: null, todos: []})),
    locationHandler = () => setState('showMode', location.hash.slice(2) || 'all');
  useEffect(() => {
    const completedCount = state.todos.filter(todo => todo.completed).length;
    setState({ completedCount, remainingCount: state.todos.length - completedCount });
  });
  window.addEventListener('hashchange', locationHandler);
  useCleanup(() => window.removeEventListener('hashchange', locationHandler));
  return {
    state,
    addTodo: ({title}) => {
      const id = state.counter + 1;
      setState(
        ['todos', t => [{title, id, completed: false}, ...t]],
        ['counter', id]
      );
    },
    removeTodo: todoId =>
      setState('todos', t => t.filter(item => item.id !== todoId))
    ,
    editTodo: todo => {
      const index = state.todos.findIndex(item => item.id === todo.id);
      setState('todos', index, todo);
    },
    clearCompleted: () =>
      setState('todos', t => t.filter(todo => !todo.completed))
    ,
    toggleAll: completed =>
      setState('todos', todo => todo.completed !== completed, {completed})
    ,
    setCurrent: todoId => setState('edittingTodoId', todoId)
  }
}