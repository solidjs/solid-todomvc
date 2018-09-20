import { each, when } from 'solid-js';
import { r } from 'solid-js/dom';

const ESCAPE_KEY = 27, ENTER_KEY = 13;

const TodoApp = props =>
  <section class='todoapp'>
    <TodoHeader {...props} />
    {when(() => <TodoList {...props} />)(() => props.state.todos.length > 0)}
    {when(() => <TodoFooter {...props} />)(() => props.state.todos.length > 0)}
  </section>

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
  const { state, toggleAll } = props;
  function filterList(todos) {
    if (state.showMode === 'active') return todos.filter(todo => !todo.completed);
    else if (state.showMode === 'completed') return todos.filter(todo => todo.completed);
    else return todos
  }

  return <section class='main'>
    <input
      id='toggle-all'
      class='toggle-all'
      type='checkbox'
      checked={!state.remainingCount}
      onchange={
        ({target: {checked}}) => toggleAll(checked)
      }
    />
    <label for='toggle-all' />
    <ul class='todo-list'>{
      each(todo =>
        <TodoItem {...props} todo={todo} />
      )(() => filterList(state.todos))
    }</ul>
  </section>
}

const TodoItem = ({ state, editTodo, removeTodo, todo }) => {
  function onSave({target: {value}}) {
    let title;
    if (!(state.edittingTodoId === todo.id && (title = value.trim()))) return;
    editTodo({id: todo.id, title});
    state.set({edittingTodoId: null});
  }

  return <li class='todo' classList={{completed: todo.completed, editing: todo.id === state.edittingTodoId}}>
    <div class='view'>
      <input
        class='toggle' type='checkbox' checked={todo.completed}
        onchange={
          ({target: {checked}}) => editTodo({id: todo.id, completed: checked})
        }
      />
      <label ondblclick={() => state.set({edittingTodoId: todo.id}) }>{todo.title}</label>
      <button class='destroy' onclick={() => removeTodo(todo.id) } />
    </div>
    {
      (todo.id === state.edittingTodoId) &&
        <input
          class='edit'
          value={todo.title}
          onblur={onSave}
          onkeyup={e => {
            if (e.keyCode === ENTER_KEY) onSave(e)
            else if (e.keyCode === ESCAPE_KEY) state.set({edittingTodoId: null})
          }}
        />
    }
  </li>
}

const TodoFooter = ({ state, clearCompleted }) =>
  <footer class='footer'>
    <span class='todo-count'>
      <strong>{state.remainingCount}</strong>
      {state.remainingCount === 1 ? ' item' : ' items'} left
    </span>
    <ul class='filters'>
      <li><a href='#/' classList={{selected: state.showMode === 'all'}}>All</a></li>
      <span />
      <li><a href='#/active' classList={{selected: state.showMode === 'active'}}>Active</a></li>
      <span />
      <li><a href='#/completed' classList={{selected: state.showMode === 'completed'}}>Completed</a></li>
    </ul>
    {
      when(() =>
        <button class='clear-completed' onclick={() => clearCompleted() }>Clear completed</button>
      )(() => state.completedCount > 0)
    }
  </footer>

export default TodoApp;