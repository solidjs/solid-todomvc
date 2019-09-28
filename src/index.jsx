import { createState, onCleanup } from 'solid-js';
import { render, selectWhen } from 'solid-js/dom';
import createTodosStore from './createTodosStore';

const ESCAPE_KEY = 27,
  ENTER_KEY = 13;

const setFocus = (el) => Promise.resolve().then(() => el.focus());

const TodoApp = () => {
  const [store, {addTodo, toggleAll, editTodo, removeTodo, clearCompleted, setVisibility}] = createTodosStore(),
    locationHandler = () => setVisibility(location.hash.slice(2) || 'all');

  window.addEventListener('hashchange', locationHandler);
  onCleanup(() => window.removeEventListener('hashchange', locationHandler));

  return <section class='todoapp'>
    <TodoHeader addTodo={addTodo} />
    <Show when={(store.todos.length > 0)}>
      <TodoList {...{store, toggleAll, editTodo, removeTodo}}/>
      <TodoFooter store={store} clearCompleted={clearCompleted} />
    </Show>
  </section>
}

const TodoHeader = ({ addTodo }) =>
  <header class='header'>
    <h1>todos</h1>
    <input
      class='new-todo'
      placeholder='What needs to be done?'
      onKeyUp={({target, keyCode}) => {
        let title;
        if (!(keyCode === ENTER_KEY && (title = target.value.trim()))) return;
        addTodo({title});
        target.value = '';
      }}
    />
  </header>

const TodoList = ({ store, editTodo, removeTodo, toggleAll }) => {
  const [state, setState] = createState(),
    filterList = todos => {
      if (store.showMode === 'active') return todos.filter(todo => !todo.completed);
      else if (store.showMode === 'completed') return todos.filter(todo => todo.completed);
      else return todos
    },
    isEditing = todoId => state.editingTodoId === todoId,
    setCurrent = todoId => setState('editingTodoId', todoId),
    save = ({target: {value}}, todoId) => {
      let title;
      if (!(state.editingTodoId === todoId && (title = value.trim()))) return;
      editTodo({id: todoId, title});
      setCurrent();
    },
    toggle = ({target: {checked}}, todoId) => editTodo({id: todoId, completed: checked}),
    edit = (e, todoId) => setCurrent(todoId),
    remove = (e, todoId) => removeTodo(todoId),
    doneEditing = (e, todoId) => {
      if (e.keyCode === ENTER_KEY) save(e, todoId);
      else if (e.keyCode === ESCAPE_KEY) setCurrent();
    };

  return <section class='main'>
    <input
      id='toggle-all'
      class='toggle-all'
      type='checkbox'
      checked={(!store.remainingCount)}
      onInput={({target: {checked}}) => toggleAll(checked)}
    />
    <label for='toggle-all' />
    <ul class='todo-list'>
      <For each={(filterList(store.todos))}
        transform={selectWhen(() => state.editingTodoId, 'editing')}
      >{
        todo => <TodoItem {...{todo, isEditing, toggle, edit, remove, doneEditing, save}} />
      }</For>
    </ul>
  </section>
}

const TodoItem = ({ todo, isEditing, toggle, edit, remove, save, doneEditing }) =>
  <li class='todo' model={todo.id} classList={({completed: todo.completed})}>
    <div class='view'>
      <input
        class='toggle'
        type='checkbox'
        checked={(todo.completed)}
        onInput={toggle}
      />
      <label onDblClick={edit}>{(todo.title)}</label>
      <button class='destroy' onClick={remove} />
    </div>
    <Show when={(isEditing(todo.id))}>
      <input
        class='edit'
        value={todo.title}
        onFocusOut={save}
        onKeyUp={doneEditing}
        forwardRef={setFocus}
      />
    </Show>
  </li>

const TodoFooter = ({ store, clearCompleted }) =>
  <footer class='footer'>
    <span class='todo-count'>
      <strong>{(store.remainingCount)}</strong>
      {(store.remainingCount === 1 ? ' item' : ' items')} left
    </span>
    <ul class='filters'>
      <li><a href='#/' classList={({selected: store.showMode === 'all'})}>All</a></li>
      <li><a href='#/active' classList={({selected: store.showMode === 'active'})}>Active</a></li>
      <li><a href='#/completed' classList={({selected: store.showMode === 'completed'})}>Completed</a></li>
    </ul>
    <Show when={(store.completedCount > 0)}>
      <button class='clear-completed' onClick={clearCompleted}>Clear completed</button>
    </Show>
  </footer>

render(TodoApp, document.getElementById('main'));