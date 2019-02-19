import { createState, createEffect } from 'solid-js';

const LOCAL_STORAGE_KEY = 'todos-solid';

function createLocalState(value) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY),
    [state, setState] = createState(stored ? JSON.parse(stored) : value);

  // JSON.stringify creates deps on every iterable field
  createEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)));
  return [state, setState];
}

export default function createTodosStore() {
  const [state, setState] = createLocalState({counter: 0, todos: [], showMode: 'all'});
  createEffect(() => {
    const completedCount = state.todos.filter(todo => todo.completed).length;
    setState({ completedCount, remainingCount: state.todos.length - completedCount });
  });

  return [
    state, {
    addTodo: ({title}) => setState(
      ['todos', t => [{title, id: state.counter, completed: false}, ...t]],
      ['counter', c => c + 1]
    ),
    removeTodo: todoId => setState('todos', t => t.filter(item => item.id !== todoId)),
    editTodo: todo => setState('todos', state.todos.findIndex(item => item.id === todo.id), todo),
    clearCompleted: () => setState('todos', t => t.filter(todo => !todo.completed)),
    toggleAll: completed => setState('todos', todo => todo.completed !== completed, {completed}),
    setVisibility: showMode => setState('showMode', showMode)
  }];
}
