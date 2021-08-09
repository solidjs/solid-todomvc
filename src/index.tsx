import { createMemo, createEffect, onCleanup, Show, For } from "solid-js"
import { createStore, StoreNode, SetStoreFunction } from "solid-js/store"
import { render } from "solid-js/web"
import type { Component } from "solid-js"

const ESCAPE_KEY = 27
const ENTER_KEY = 13

// @ts-expect-error - ts(6133) this is actually used below in `use:setFocus`
const setFocus = (el: HTMLInputElement) => setTimeout(() => el.focus())

const LOCAL_STORAGE_KEY = "todos-solid"
const createLocalStore = <T extends StoreNode>(value: T): [T, SetStoreFunction<T>] => {
  // load stored todos on init
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
  const [state, setState] = createStore<T>(stored ? JSON.parse(stored) : value)

  createEffect(() => {
    // JSON.stringify creates deps on every iterable field
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  })
  return [state, setState]
}

const TodoApp: Component = () => {
  // Are the typescript types lame, or is this type a bad idea?
  interface SolidInputEvent extends InputEvent {
    currentTarget: HTMLInputElement // // TODO convert underlying declaration to an `interface` - assuming this code exists somewhere :)
    target: Element
  }
  interface SolidKeyboardEvent extends KeyboardEvent {
    currentTarget: HTMLInputElement
    target: Element // Making this `HTMLInputElement` creates this error at bottom of file:
    //  Types of property 'target' are incompatible.
    //    Type 'EventTarget & Element' is not assignable to type 'HTMLInputElement'
  }

  interface TodoItem {
    id: TodoID
    completed?: boolean
    title?: string // I don't understand why these should be optional
  }
  type ShowMode = "all" | "active" | "completed"
  type ReadonlyTodos = readonly TodoItem[]
  type Todos = TodoItem[]
  type TodoID = null | number
  type StoreState = {
    counter: number
    todos: Todos // Making this ReadonlyTodos causes some odd error inside editTodo
    showMode: ShowMode
    editingTodoId: TodoID
  }
  const [state, setState] = createLocalStore({
    counter: 1,
    todos: [],
    showMode: "all",
    editingTodoId: null,
  } as StoreState)
  const selectCompleted = (todos: ReadonlyTodos) => todos.filter((todo) => todo.completed)
  const selectIncomplete = (todos: ReadonlyTodos) => todos.filter((todo) => !todo.completed)
  const remainingCount = createMemo(() => {
    return state.todos.length - selectCompleted(state.todos).length
  })

  const removeTodo = (id: number) => {
    // Two args
    setState(
      "todos",
      (
        todos: ReadonlyTodos // odd
      ) => {
        return todos.filter(
          (
            todo // : TodoItem // Type was pretty odd here - ideally don't need `: TodoItem`
          ) => {
            return todo.id !== id
          }
        )
      }
    )
  }

  const clearCompleted = () => {
    // Two args
    setState(
      "todos",
      (
        todos: readonly TodoItem[] // readonly?
      ) => todos.filter((todo) => !todo.completed)
    )
  }

  const editTodo = (newTodo: TodoItem) => {
    // Three args
    setState(
      "todos",
      (
        existingTodo // TodoItem
      ) => {
        return existingTodo.id === newTodo.id
      },
      newTodo // Hard to know what this is without reading docs. JSDocs on hover would be good.
    )
  }
  const toggleAll = ({ target }: InputEvent) => {
    const completed = (target as HTMLInputElement).checked

    // Three args
    setState(
      "todos",
      (
        todo // TodoItem
      ) => {
        return todo.completed !== completed
      },
      { completed }
    )
  }

  const setEditing = (todoId: TodoID) => {
    // Two args
    setState("editingTodoId", todoId)
  }
  const save = (todoId: TodoID, { target }: SolidKeyboardEvent) => {
    const { value } = target
    const title = value.trim()
    if (state.editingTodoId === todoId && title && todoId !== null) {
      editTodo({
        id: todoId,
        title,
      })
      setEditing(todoId)
    }
  }
  const toggle = (todoId: TodoID, { target }: SolidInputEvent) => {
    editTodo({
      id: todoId,
      // TODO: should not need `as HTMLInputElement`
      completed: (target as HTMLInputElement).checked,
    })
  }
  const doneEditing = (todoId: TodoID, event: SolidKeyboardEvent) => {
    if (event.keyCode === ENTER_KEY) save(todoId, event)
    else if (event.keyCode === ESCAPE_KEY) setEditing(todoId)
  }

  const locationHandler = () => {
    // TODO: validate this is actually a valid showMode
    // Probably we want to move the base `type ShowMode` to be a javascript const thing
    const showMode = window.location.hash.slice(2) as ShowMode
    setState("showMode", showMode || "all")
  }
  window.addEventListener("hashchange", locationHandler)
  onCleanup(() => window.removeEventListener("hashchange", locationHandler))

  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          onKeyDown={({ target, keyCode }: SolidKeyboardEvent) => {
            // TODO: should not need `as HTMLInputElement`
            const title = (target as HTMLInputElement).value.trim()
            if (keyCode === ENTER_KEY && title) {
              setState({
                todos: [
                  {
                    title,
                    id: state.counter,
                    completed: false,
                  },
                  ...state.todos,
                ],
                counter: state.counter + 1,
              })
              ;(target as HTMLInputElement).value = ""
            }
          }}
        />
      </header>

      <Show when={state.todos.length > 0}>
        <section class="main">
          <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={!remainingCount()}
            onInput={
              (a, b, c) => {
                toggleAll(data, event)
              },
            }
          />
          <label for="toggle-all" />
          <ul class="todo-list">
            <For
              each={
                state.showMode === "active"
                  ? selectIncomplete(state.todos)
                  : state.showMode === "completed"
                  ? selectCompleted(state.todos)
                  : state.todos
              }
            >
              {(todo) => (
                <li
                  class="todo"
                  classList={{
                    editing: state.editingTodoId === todo.id,
                    completed: todo.completed,
                  }}
                >
                  <div class="view">
                    <input
                      class="toggle"
                      type="checkbox"
                      checked={todo.completed}
                      onInput={[
                        (data, event) => {
                          toggle(data, event)
                        },
                        todo.id,
                      ]}
                    />
                    <label
                      onDblClick={[
                        (data, _event) => {
                          setEditing(data)
                        },
                        todo.id,
                      ]}
                    >
                      {todo.title}
                    </label>
                    <button class="destroy" onClick={[removeTodo, todo.id]} />
                  </div>
                  <Show when={state.editingTodoId === todo.id}>
                    <input
                      class="edit"
                      type="text"
                      value={todo.title}
                      onFocusOut={[
                        (data, event) => {
                          save(data, event)
                        },
                        todo.id,
                      ]}
                      onKeyUp={[
                        (data, event) => {
                          doneEditing(data, event)
                        },
                        todo.id,
                      ]}
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
            <strong>{remainingCount()}</strong> item{remainingCount() === 1 ? "" : "s"} left
          </span>
          <ul class="filters">
            <li>
              <a href="#/" classList={{ selected: state.showMode === "all" }}>
                All
              </a>
            </li>
            <li>
              <a href="#/active" classList={{ selected: state.showMode === "active" }}>
                Active
              </a>
            </li>
            <li>
              <a href="#/completed" classList={{ selected: state.showMode === "completed" }}>
                Completed
              </a>
            </li>
          </ul>
          <Show when={remainingCount() !== state.todos.length}>
            <button class="clear-completed" onClick={clearCompleted}>
              Clear completed
            </button>
          </Show>
        </footer>
      </Show>
    </section>
  )
}

render(() => <TodoApp />, document.getElementById("root") as HTMLDivElement)
