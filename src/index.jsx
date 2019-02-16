import { createRoot, createState, createEffect, onCleanup } from 'solid-js';
import { r, selectWhen } from 'solid-js/dom';

const ESCAPE_KEY = 27,
  ENTER_KEY = 13,
  LOCAL_STORAGE_KEY = 'todos-solid';

function createLocalState(value) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY),
    [state, setState] = createState(stored ? JSON.parse(stored) : value);

  // JSON.stringify creates deps on every iterable field
  createEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)));
  return [state, setState];
}

// custom directive to give focus
function autofocus(node) { Promise.resolve().then(() => node.focus()); }

const TodoApp = () => {
  const [state, setState] = createLocalState({counter: 0, edittingTodoId: null, todos: []}),
    addTodo = ({title}) => setState(
      ['todos', t => [{title, id: state.counter, completed: false}, ...t]],
      ['counter', c => c + 1]
    ),
    removeTodo = todoId => setState('todos', t => t.filter(item => item.id !== todoId)),
    editTodo = todo => setState('todos', state.todos.findIndex(item => item.id === todo.id), todo),
    clearCompleted = () => setState('todos', t => t.filter(todo => !todo.completed)),
    toggleAll = completed => setState('todos', todo => todo.completed !== completed, {completed}),
    setCurrent = todoId => setState('edittingTodoId', todoId),
    locationHandler = () => setState('showMode', location.hash.slice(2) || 'all');

  createEffect(() => {
    const completedCount = state.todos.filter(todo => todo.completed).length;
    setState({ completedCount, remainingCount: state.todos.length - completedCount });
  });

  window.addEventListener('hashchange', locationHandler);
  onCleanup(() => window.removeEventListener('hashchange', locationHandler));

  return <section class='todoapp'>
    <TodoHeader addTodo={addTodo} />
    <$ when={state.todos.length > 0}>
      <TodoList {...{state, toggleAll, editTodo, removeTodo, setCurrent}}/>
      <TodoFooter {...{state, clearCompleted}}/>
    </$>
  </section>
}

const TodoHeader = ({ addTodo }) =>
  <header class='header'>
    <h1>todos</h1>
    <input
      class='new-todo'
      placeholder='What needs to be done?'
      onkeyup={({target, keyCode}) => {
        let title;
        if (!(keyCode === ENTER_KEY && (title = target.value.trim()))) return;
        addTodo({title});
        target.value = '';
      }}
    />
  </header>

const TodoList = ({ state, editTodo, setCurrent, removeTodo, toggleAll }) => {
  const filterList = todos => {
      if (state.showMode === 'active') return todos.filter(todo => !todo.completed);
      else if (state.showMode === 'completed') return todos.filter(todo => todo.completed);
      else return todos
    },
    save = ({target: {value}}, todoId) => {
      let title;
      if (!(state.edittingTodoId === todoId && (title = value.trim()))) return;
      editTodo({id: todoId, title});
      setCurrent();
    },
    check = ({target: {checked}}, todoId) => editTodo({id: todoId, completed: checked}),
    edit = (e, todoId) => setCurrent(todoId),
    remove = (e, todoId) => removeTodo(todoId),
    doneEditting = (e, todoId) => {
      if (e.keyCode === ENTER_KEY) save(e, todoId);
      else if (e.keyCode === ESCAPE_KEY) setCurrent();
    };

  return <section class='main'>
    <input
      id='toggle-all'
      class='toggle-all'
      type='checkbox'
      checked={(!state.remainingCount)}
      onchange={({target: {checked}}) => toggleAll(checked)}
    />
    <label for='toggle-all' />
    <ul class='todo-list'>
      <$
        each={filterList(state.todos)}
        afterRender={selectWhen(() => state.edittingTodoId, 'editing')}
      >{
        todo => <TodoItem {...{state, todo, check, edit, remove, doneEditting, save}} />
      }</$>
    </ul>
  </section>
}

const TodoItem = ({ state, todo, check, edit, remove, save, doneEditting }) =>
  <li class='todo' model={todo.id} classList={({completed: todo.completed})}>
    <div class='view'>
      <input
        class='toggle'
        type='checkbox'
        checked={(todo.completed)}
        onChange={check}
      />
      <label onDblClick={edit}>{(todo.title)}</label>
      <button class='destroy' onClick={remove} />
    </div>
    <$ when={todo.id === state.edittingTodoId}>
      <input
        class='edit'
        value={todo.title}
        $autofocus={true}
        onFocusOut={save}
        onKeyUp={doneEditting}
      />
    </$>
  </li>

const TodoFooter = ({ state, clearCompleted }) =>
  <footer class='footer'>
    <span class='todo-count'>
      <strong>{(state.remainingCount)}</strong>
      {(state.remainingCount === 1 ? ' item' : ' items')} left
    </span>
    <ul class='filters'>
      <li><a href='#/' classList={({selected: state.showMode === 'all'})}>All</a></li>
      <li><a href='#/active' classList={({selected: state.showMode === 'active'})}>Active</a></li>
      <li><a href='#/completed' classList={({selected: state.showMode === 'completed'})}>Completed</a></li>
    </ul>
    <$ when={ state.completedCount > 0 }>
      <button class='clear-completed' onclick={clearCompleted}>Clear completed</button>
    </$>
  </footer>

createRoot(() => document.body.appendChild(<TodoApp />));