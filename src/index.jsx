import { createState, onCleanup } from "solid-js";
import { render } from "solid-js/dom";
import createTodosStore from "./createTodosStore";

const ESCAPE_KEY = 27,
  ENTER_KEY = 13;

const setFocus = el => setTimeout(() => el.focus());

const TodoApp = () => {
  const [
      store,
      { addTodo, toggleAll, editTodo, removeTodo, clearCompleted, setVisibility }
    ] = createTodosStore(),
    locationHandler = () => setVisibility(location.hash.slice(2) || "all");

  window.addEventListener("hashchange", locationHandler);
  onCleanup(() => window.removeEventListener("hashchange", locationHandler));

  return (
    <section class="todoapp">
      <TodoHeader addTodo={addTodo} />
      <Show when={store.todos.length > 0}>
        <TodoList store={store} toggleAll={toggleAll} editTodo={editTodo} removeTodo={removeTodo} />
        <TodoFooter store={store} clearCompleted={clearCompleted} />
      </Show>
    </section>
  );
};

const TodoHeader = ({ addTodo }) => (
  <header class="header">
    <h1>todos</h1>
    <input
      class="new-todo"
      placeholder="What needs to be done?"
      onKeyDown={({ target, keyCode }) => {
        const title = target.value.trim();
        if (keyCode === ENTER_KEY && title) {
          addTodo({ title });
          target.value = "";
        }
      }}
    />
  </header>
);

const TodoList = ({ store, editTodo, removeTodo, toggleAll }) => {
  const [state, setState] = createState({ editingTodoId: null }),
    filterList = todos => {
      if (store.showMode === "active") return todos.filter(todo => !todo.completed);
      else if (store.showMode === "completed") return todos.filter(todo => todo.completed);
      else return todos;
    },
    isEditing = todoId => state.editingTodoId === todoId,
    setCurrent = todoId => setState("editingTodoId", todoId),
    save = (todoId, { target: { value } }) => {
      const title = value.trim();
      if (state.editingTodoId === todoId && title) {
        editTodo({ id: todoId, title });
        setCurrent();
      }
    },
    toggle = (todoId, { target: { checked } }) => editTodo({ id: todoId, completed: checked }),
    edit = todoId => setCurrent(todoId),
    remove = todoId => removeTodo(todoId),
    doneEditing = todoId => {
      if (e.keyCode === ENTER_KEY) save(e, todoId);
      else if (e.keyCode === ESCAPE_KEY) setCurrent();
    };

  return (
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        checked={!store.remainingCount}
        onInput={({ target: { checked } }) => toggleAll(checked)}
      />
      <label for="toggle-all" />
      <ul class="todo-list">
        <For each={filterList(store.todos)}>
          {todo => (
            <TodoItem
              todo={todo}
              isEditing={isEditing}
              toggle={toggle}
              edit={edit}
              remove={remove}
              doneEditing={doneEditing}
              save={save}
            />
          )}
        </For>
      </ul>
    </section>
  );
};

const TodoItem = ({ todo, isEditing, toggle, edit, remove, save, doneEditing }) => (
  <li class="todo" classList={{ editing: isEditing(todo.id), completed: todo.completed }}>
    <div class="view">
      <input class="toggle" type="checkbox" checked={todo.completed} onInput={[toggle, todo.id]} />
      <label onDblClick={[edit, todo.id]}>{todo.title}</label>
      <button class="destroy" onClick={[remove, todo.id]} />
    </div>
    <Show when={isEditing(todo.id)}>
      <input
        class="edit"
        value={todo.title}
        onFocusOut={[save, todo.id]}
        onKeyUp={[doneEditing, todo.id]}
        ref={setFocus}
      />
    </Show>
  </li>
);

const TodoFooter = ({ store, clearCompleted }) => (
  <footer class="footer">
    <span class="todo-count">
      <strong>{store.remainingCount}</strong>
      {store.remainingCount === 1 ? " item " : " items "} left
    </span>
    <ul class="filters">
      <li>
        <a href="#/" classList={{ selected: store.showMode === "all" }}>
          All
        </a>
      </li>
      <li>
        <a href="#/active" classList={{ selected: store.showMode === "active" }}>
          Active
        </a>
      </li>
      <li>
        <a href="#/completed" classList={{ selected: store.showMode === "completed" }}>
          Completed
        </a>
      </li>
    </ul>
    <Show when={store.completedCount > 0}>
      <button class="clear-completed" onClick={clearCompleted}>
        Clear completed
      </button>
    </Show>
  </footer>
);

render(TodoApp, document.getElementById("main"));
