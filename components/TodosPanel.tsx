"use client";

import { useState } from "react";

import { applyFilter, countActive, groupTodos, searchTodos } from "@/lib/todos";
import type { Todo, TodoFilter } from "@/lib/types";

import { EmptyState } from "./EmptyState";
import { PlusIcon } from "./Icons";
import { TodoItem } from "./TodoItem";
import { card, input, primaryButton } from "./styles";

const FILTERS: { id: TodoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
];

function Composer({
  onAdd,
}: {
  onAdd: (title: string, dueDate: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, dueDate || null);
    setTitle("");
    setDueDate("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input
        value={title}
        aria-label="New task"
        placeholder="What needs doing?"
        onChange={(event) => setTitle(event.target.value)}
        className={input}
      />
      <input
        type="date"
        value={dueDate}
        aria-label="Due date (optional)"
        onChange={(event) => setDueDate(event.target.value)}
        className={`${input} sm:w-44`}
      />
      <button type="submit" className={primaryButton} disabled={!title.trim()}>
        <PlusIcon />
        Add
      </button>
    </form>
  );
}

export function TodosPanel({
  todos,
  query,
  today,
  hydrated,
  onAdd,
  onToggle,
  onSave,
  onDelete,
  onClearCompleted,
}: {
  todos: Todo[];
  query: string;
  today: string;
  hydrated: boolean;
  onAdd: (title: string, dueDate: string | null) => void;
  onToggle: (id: string) => void;
  onSave: (id: string, title: string, dueDate: string | null) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
}) {
  const [filter, setFilter] = useState<TodoFilter>("all");

  const active = countActive(todos);
  const counts: Record<TodoFilter, number> = {
    all: todos.length,
    active,
    completed: todos.length - active,
  };

  const visible = searchTodos(applyFilter(todos, filter), query);
  const groups = groupTodos(visible, today);

  return (
    <div className="space-y-4">
      <Composer onAdd={onAdd} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="group" aria-label="Filter tasks">
          {FILTERS.map((option) => {
            const selected = option.id === filter;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {option.label}
                <span className="ml-1 opacity-70">{counts[option.id]}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted" aria-live="polite">
            {active === 0
              ? todos.length === 0
                ? ""
                : "All caught up"
              : `${active} task${active === 1 ? "" : "s"} left`}
          </p>
          {counts.completed > 0 ? (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-xs font-medium text-muted underline-offset-2 transition-colors hover:text-danger hover:underline"
            >
              Clear completed
            </button>
          ) : null}
        </div>
      </div>

      {/* Nothing is rendered until localStorage has been read, so the empty
          state can't flash over tasks that are about to appear. */}
      {!hydrated ? null : todos.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          hint="Add your first one above. A due date is optional."
        />
      ) : groups.length === 0 ? (
        <EmptyState
          title={query ? "No tasks match your search" : "Nothing in this filter"}
          hint={query ? `Nothing found for "${query}".` : undefined}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <h2
                id={`group-${group.key}`}
                className={`mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide ${
                  group.key === "overdue" ? "text-danger" : "text-muted"
                }`}
              >
                {group.label}
                <span className="ml-1.5 font-normal opacity-70">
                  {group.todos.length}
                </span>
              </h2>
              <ul className={`${card} divide-y divide-line`}>
                {group.todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    today={today}
                    onToggle={() => onToggle(todo.id)}
                    onSave={(title, dueDate) => onSave(todo.id, title, dueDate)}
                    onDelete={() => onDelete(todo.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
