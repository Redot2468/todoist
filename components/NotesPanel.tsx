"use client";

import { useState } from "react";

import { formatRelativeTime } from "@/lib/dates";
import { searchNotes } from "@/lib/todos";
import type { Note } from "@/lib/types";

import { EmptyState } from "./EmptyState";
import { PencilIcon, PlusIcon, TrashIcon } from "./Icons";
import { card, iconButton, input, primaryButton, subtleButton } from "./styles";

function NoteForm({
  initialTitle = "",
  initialBody = "",
  submitLabel,
  // The composer and an open note editor can be on screen at once, so their
  // fields need distinct accessible names.
  titleLabel = "Note title",
  bodyLabel = "Note body",
  onSubmit,
  onCancel,
}: {
  initialTitle?: string;
  initialBody?: string;
  submitLabel: string;
  titleLabel?: string;
  bodyLabel?: string;
  onSubmit: (title: string, body: string) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  const isEmpty = !title.trim() && !body.trim();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isEmpty) return;
        onSubmit(title.trim(), body.trim());
        if (!onCancel) {
          setTitle("");
          setBody("");
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel?.();
      }}
      className="space-y-2"
    >
      <input
        value={title}
        aria-label={titleLabel}
        placeholder="Note title"
        onChange={(event) => setTitle(event.target.value)}
        className={input}
      />
      <textarea
        value={body}
        rows={4}
        aria-label={bodyLabel}
        placeholder="Write anything you want to remember…"
        onChange={(event) => setBody(event.target.value)}
        className={`${input} resize-y`}
      />
      <div className="flex gap-2">
        <button type="submit" className={primaryButton} disabled={isEmpty}>
          {onCancel ? null : <PlusIcon />}
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className={subtleButton} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function NoteCard({
  note,
  onSave,
  onDelete,
}: {
  note: Note;
  onSave: (title: string, body: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const label = note.title || "Untitled note";

  return (
    <article className={`${card} p-4`}>
      {editing ? (
        <NoteForm
          initialTitle={note.title}
          initialBody={note.body}
          submitLabel="Save"
          onSubmit={(title, body) => {
            onSave(title, body);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-sm font-medium break-words text-foreground">
              {note.title || <span className="text-muted">Untitled note</span>}
            </h3>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className={iconButton}
                aria-label={`Edit "${label}"`}
                onClick={() => setEditing(true)}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className={`${iconButton} hover:text-danger`}
                aria-label={`Delete "${label}"`}
                onClick={onDelete}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          {note.body ? (
            <p className="mt-1.5 text-sm whitespace-pre-wrap break-words text-muted">
              {note.body}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-muted">
            Edited {formatRelativeTime(note.updatedAt)}
          </p>
        </>
      )}
    </article>
  );
}

export function NotesPanel({
  notes,
  query,
  hydrated,
  onAdd,
  onSave,
  onDelete,
}: {
  notes: Note[];
  query: string;
  hydrated: boolean;
  onAdd: (title: string, body: string) => void;
  onSave: (id: string, title: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  // Most recently edited first, so a note you just touched surfaces to the top.
  const visible = searchNotes(notes, query).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <div className="space-y-4">
      <div className={`${card} p-4`}>
        <NoteForm
          submitLabel="Add note"
          titleLabel="New note title"
          bodyLabel="New note body"
          onSubmit={onAdd}
        />
      </div>

      {!hydrated ? null : notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          hint="Notes are for the things that aren't tasks — ideas, links, reminders."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No notes match your search"
          hint={query ? `Nothing found for "${query}".` : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSave={(title, body) => onSave(note.id, title, body)}
              onDelete={() => onDelete(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
