"use client";

import { useMemo, useState } from "react";

import { today as currentDate } from "@/lib/dates";
import { newId, useLocalStorage } from "@/lib/useLocalStorage";
import { parseNotes, parseTodos, type Note, type Tab, type Todo } from "@/lib/types";

import { NotesPanel } from "./NotesPanel";
import { SearchBar } from "./SearchBar";
import { TabBar } from "./TabBar";
import { TodosPanel } from "./TodosPanel";

const TODOS_KEY = "tasks-notes:todos:v1";
const NOTES_KEY = "tasks-notes:notes:v1";

const EMPTY_TODOS: Todo[] = [];
const EMPTY_NOTES: Note[] = [];

export function TaskApp() {
  const [todos, setTodos, todosReady] = useLocalStorage(
    TODOS_KEY,
    EMPTY_TODOS,
    parseTodos,
  );
  const [notes, setNotes, notesReady] = useLocalStorage(
    NOTES_KEY,
    EMPTY_NOTES,
    parseNotes,
  );

  const [tab, setTab] = useState<Tab>("todos");
  const [query, setQuery] = useState("");

  // Resolved once per mount; every consumer compares against the same "today".
  const today = useMemo(() => currentDate(), []);

  function addTodo(title: string, dueDate: string | null) {
    setTodos((current) => [
      {
        id: newId(),
        title,
        done: false,
        dueDate,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      ...current,
    ]);
  }

  function toggleTodo(id: string) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              done: !todo.done,
              completedAt: todo.done ? null : new Date().toISOString(),
            }
          : todo,
      ),
    );
  }

  function saveTodo(id: string, title: string, dueDate: string | null) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, title, dueDate } : todo)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((current) => current.filter((todo) => !todo.done));
  }

  function addNote(title: string, body: string) {
    const now = new Date().toISOString();
    setNotes((current) => [
      { id: newId(), title, body, createdAt: now, updatedAt: now },
      ...current,
    ]);
  }

  function saveNote(id: string, title: string, body: string) {
    setNotes((current) =>
      current.map((note) =>
        note.id === id
          ? { ...note, title, body, updatedAt: new Date().toISOString() }
          : note,
      ),
    );
  }

  function deleteNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tasks &amp; Notes
        </h1>
        <p className="mt-1 text-sm text-muted">
          A to-do list with due dates, a notebook, and one search across both.
          Everything stays in this browser.
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <TabBar
          active={tab}
          counts={{ todos: todos.length, notes: notes.length }}
          onChange={setTab}
        />
        <SearchBar
          value={query}
          placeholder={tab === "todos" ? "Search tasks" : "Search notes"}
          onChange={setQuery}
        />
      </div>

      <div
        role="tabpanel"
        id="panel-todos"
        aria-labelledby="tab-todos"
        hidden={tab !== "todos"}
      >
        {tab === "todos" ? (
          <TodosPanel
            todos={todos}
            query={query}
            today={today}
            hydrated={todosReady}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onSave={saveTodo}
            onDelete={deleteTodo}
            onClearCompleted={clearCompleted}
          />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id="panel-notes"
        aria-labelledby="tab-notes"
        hidden={tab !== "notes"}
      >
        {tab === "notes" ? (
          <NotesPanel
            notes={notes}
            query={query}
            hydrated={notesReady}
            onAdd={addNote}
            onSave={saveNote}
            onDelete={deleteNote}
          />
        ) : null}
      </div>

      <footer className="mt-12 border-t border-line pt-5 text-xs text-muted">
        Saved to this browser&apos;s local storage — no account, no server. Clearing
        site data will clear your tasks and notes.
      </footer>
    </main>
  );
}
