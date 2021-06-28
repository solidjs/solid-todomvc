import { createMemo, createEffect, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { render } from "solid-js/web";

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;

const setFocus = (el) => setTimeout(() => el.focus());

const LOCAL_STORAGE_KEY = "todos-solid";
function createLocalStore(value) {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY),
    [state, setState] = createStore(stored ? JSON.parse(stored) : value);

  // JSON.stringify creates deps on every iterable field
  createEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)));
  return [state, setState];
}

const TodoApp = () => {
  const [state, setState] = createLocalStore({
      counter: 1,
      todos: [],
      showMode: "all",
      editingTodoId: null,
    }),
    remainingCount = createMemo(() => state.todos.length - state.todos.filter((todo) => todo.completed).length),
    filterList = (todos) => {
      if (state.showMode === "active") return todos.filter((todo) => !todo.completed);
      else if (state.showMode === "completed") return todos.filter((todo) => todo.completed);
      else return todos;
    },
    removeTodo = (todoId) => setState("todos", (t) => t.filter((item) => item.id !== todoId)),
    editTodo = (todo) => setState("todos", (item) => item.id === todo.id, todo),
    clearCompleted = () => setState("todos", (t) => t.filter((todo) => !todo.completed)),
    toggleAll = (completed) => setState("todos", (todo) => todo.completed !== completed, { completed }),
    setEditing = (todoId) => setState("editingTodoId", todoId),
    addTodo = ({ target, keyCode }) => {
      const title = target.value.trim();
      if (keyCode === ENTER_KEY && title) {
        setState({
          todos: [{ title, id: state.counter, completed: false }, ...state.todos],
          counter: state.counter + 1
        });
        target.value = "";
      }
    },
    save = (todoId, { target: { value } }) => {
      const title = value.trim();
      if (state.editingTodoId === todoId && title) {
        editTodo({ id: todoId, title });
        setEditing();
      }
    },
    toggle = (todoId, { target: { checked } }) => editTodo({ id: todoId, completed: checked }),
    doneEditing = (todoId, e) => {
      if (e.keyCode === ENTER_KEY) save(todoId, e);
      else if (e.keyCode === ESCAPE_KEY) setEditing();
    };

  const locationHandler = () => setState("showMode", location.hash.slice(2) || "all");
  window.addEventListener("hashchange", locationHandler);
  onCleanup(() => window.removeEventListener("hashchange", locationHandler));

  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
      </header>

      <Show when={state.todos.length > 0}>
        <section class="main">
          <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={!remainingCount()}
            onInput={({ target: { checked } }) => toggleAll(checked)}
          />
          <label for="toggle-all" />
          <ul class="todo-list">
            <For each={filterList(state.todos)}>
              {(todo) => (
                <li
                  class="todo"
                  classList={{ editing: state.editingTodoId === todo.id, completed: todo.completed }}
                >
                  <div class="view">
                    <input class="toggle" type="checkbox" checked={todo.completed} onInput={[toggle, todo.id]}/>
                    <label onDblClick={[setEditing, todo.id]}>{todo.title}</label>
                    <button class="destroy" onClick={[removeTodo, todo.id]} />
                  </div>
                  <Show when={state.editingTodoId === todo.id}>
                    <input
                      class="edit"
                      value={todo.title}
                      onFocusOut={[save, todo.id]}
                      onKeyUp={[doneEditing, todo.id]}
                      use:setFocus
                    />
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </section>

        <footer class="footer">
          <span class="todo-count">
            <strong>{remainingCount()}</strong>{" "}
            {remainingCount() === 1 ? " item " : " items "} left
          </span>
          <ul class="filters">
            <li><a href="#/" classList={{selected: state.showMode === "all"}}>All</a></li>
            <li><a href="#/active" classList={{selected: state.showMode === "active"}}>Active</a></li>
            <li><a href="#/completed" classList={{selected: state.showMode === "completed"}}>Completed</a></li>
          </ul>
          <Show when={remainingCount() !== state.todos.length}>
            <button class="clear-completed" onClick={clearCompleted}>
              Clear completed
            </button>
          </Show>
        </footer>
      </Show>
    </section>
  );
};

render(TodoApp, document.getElementById("main"));
