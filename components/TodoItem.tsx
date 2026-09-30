"use client";

import { useEffect, useRef, useState } from "react";

import { dayDelta, formatDueDate } from "@/lib/dates";
import type { Todo } from "@/lib/types";

import { CalendarIcon, CheckIcon, PencilIcon, TrashIcon } from "./Icons";
import { iconButton, input, primaryButton, subtleButton } from "./styles";

function DueBadge({ todo, today }: { todo: Todo; today: string }) {
  if (!todo.dueDate) return null;

  const delta = dayDelta(today, todo.dueDate);
  const tone = todo.done
    ? "text-muted"
    : delta < 0
      ? "text-danger"
      : delta === 0
        ? "text-warning"
        : "text-muted";

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
      <CalendarIcon className="h-3.5 w-3.5" />
      {formatDueDate(todo.dueDate, today)}
      {!todo.done && delta < 0 ? <span className="sr-only"> (overdue)</span> : null}
    </span>
  );
}

export function TodoItem({
  todo,
  today,
  onToggle,
  onSave,
  onDelete,
}: {
  todo: Todo;
  today: string;
  onToggle: () => void;
  onSave: (title: string, dueDate: string | null) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [dueDate, setDueDate] = useState(todo.dueDate ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleRef.current?.select();
  }, [editing]);

  function startEditing() {
    setTitle(todo.title);
    setDueDate(todo.dueDate ?? "");
    setEditing(true);
  }

  function commit() {
    const trimmed = title.trim();
    // An emptied title is treated as "cancel" rather than silently blanking
    // the task — there is no undo here.
    if (trimmed) onSave(trimmed, dueDate || null);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="px-3 py-3 sm:px-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            commit();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            ref={titleRef}
            autoFocus
            value={title}
            aria-label="Task name"
            onChange={(event) => setTitle(event.target.value)}
            className={input}
          />
          <input
            type="date"
            value={dueDate}
            aria-label="Due date"
            onChange={(event) => setDueDate(event.target.value)}
            className={`${input} sm:w-44`}
          />
          <div className="flex gap-2">
            <button type="submit" className={primaryButton}>
              Save
            </button>
            <button
              type="button"
              className={subtleButton}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-3 py-2.5 sm:px-4">
      <label className="mt-0.5 cursor-pointer">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={onToggle}
          aria-label={`Mark "${todo.title}" as ${todo.done ? "not done" : "done"}`}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-md border border-line text-white transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        >
          {todo.done ? <CheckIcon className="h-3.5 w-3.5" /> : null}
        </span>
      </label>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm break-words ${
            todo.done ? "text-muted line-through" : "text-foreground"
          }`}
        >
          {todo.title}
        </p>
        <DueBadge todo={todo} today={today} />
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={iconButton}
          aria-label={`Edit "${todo.title}"`}
          onClick={startEditing}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          className={`${iconButton} hover:text-danger`}
          aria-label={`Delete "${todo.title}"`}
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
