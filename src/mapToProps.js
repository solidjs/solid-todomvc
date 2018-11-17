import { State, pipe, map, cleanup, data, effect } from 'solid-js';

const LOCAL_STORAGE_KEY = 'todos-solid';

function setupPersistence(state) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) state.replace(JSON.parse(stored));

  // JSON.stringify creates deps on every iterable field
  effect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  });
}

// event wrapper
function fromEvent(el, eventName, seed) {
  const s = data(seed)
  el.addEventListener(eventName, s)
  cleanup(() => el.removeEventListener(eventName, s))
  return s
}

export default () => {
  const state = new State({ counter: 0, edittingTodoId: null, todos: [] });
  setupPersistence(state);
  state.select({
    completedCount: () => state.todos.filter(todo => todo.completed).length,
    remainingCount: () => state.todos.length - (state.completedCount || 0),
    showMode: pipe(
      fromEvent(window, 'hashchange', 1),
      map(() => location.hash.slice(2) || 'all')
    )
  })
  return {
    state,
    addTodo: ({title}) => {
      const id = state.counter + 1;
      state.set({
        todos: [
          {title, id, completed: false},
          ...state.todos
        ], counter: id
      });
    },
    removeTodo: (todoId) =>
      state.set({todos: state.todos.filter(item => item.id !== todoId)})
    ,
    editTodo: (todo) => {
      const index = state.todos.findIndex(item => item.id === todo.id);
      state.set('todos', index, todo);
    },
    clearCompleted: () =>
      state.set({todos: state.todos.filter(todo => !todo.completed)})
    ,
    toggleAll: (completed) => {
      state.todos.forEach((todo, index) =>
        todo.completed !== completed && state.set('todos', index, {completed})
      )
    }
  }
}