import { root, useState, useEffect, useCleanup } from 'solid-js';
import { r } from 'solid-js/dom';

const ESCAPE_KEY = 27,
  ENTER_KEY = 13,
  LOCAL_STORAGE_KEY = 'todos-solid';

function useLocalState(value) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY),
    [state, setState] = useState(stored ? JSON.parse(stored) : value);

  // JSON.stringify creates deps on every iterable field
  useEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)));
  return [state, setState];
}

const TodoApp = () => {
  const [state, setState] = useLocalState({counter: 0, edittingTodoId: null, todos: []}),
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

  useEffect(() => {
    const completedCount = state.todos.filter(todo => todo.completed).length;
    setState({ completedCount, remainingCount: state.todos.length - completedCount });
  });

  window.addEventListener('hashchange', locationHandler);
  useCleanup(() => window.removeEventListener('hashchange', locationHandler));

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

const TodoList = props => {
  const { state, toggleAll } = props,
    filterList = todos => {
      if (state.showMode === 'active') return todos.filter(todo => !todo.completed);
      else if (state.showMode === 'completed') return todos.filter(todo => todo.completed);
      else return todos
    }

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
      <$ each={filterList(state.todos)}>{
        todo => <TodoItem {...props} todo={todo}/>
      }</$>
    </ul>
  </section>
}

const TodoItem = ({ state, todo, editTodo, removeTodo, setCurrent }) => {
  const onSave = ({target: {value}}) => {
    let title;
    if (!(state.edittingTodoId === todo.id && (title = value.trim()))) return;
    editTodo({id: todo.id, title});
    setCurrent();
  }

  return <li class='todo' classList={({completed: todo.completed, editing: todo.id === state.edittingTodoId})}>
    <div class='view'>
      <input
        class='toggle'
        type='checkbox'
        checked={(todo.completed)}
        onchange={({target: {checked}}) => editTodo({id: todo.id, completed: checked})}
      />
      <label ondblclick={() => setCurrent(todo.id) }>{(todo.title)}</label>
      <button class='destroy' onclick={() => removeTodo(todo.id) } />
    </div>
    {((todo.id === state.edittingTodoId) &&
      <input
        class='edit'
        value={todo.title}
        onblur={onSave}
        onkeyup={e => {
          if (e.keyCode === ENTER_KEY) onSave(e);
          else if (e.keyCode === ESCAPE_KEY) setCurrent();
        }}
      />
    )}
  </li>
}

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

root(() => document.body.appendChild(<TodoApp />));