export type Todo = {
  id: string;
  title: string;
  done: boolean;
  /** Local calendar date as `YYYY-MM-DD`, never a timestamp — see lib/dates.ts. */
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type TodoFilter = "all" | "active" | "completed";

export type Tab = "todos" | "notes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableDate(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Anything read back out of localStorage is untrusted: it may be corrupt, or
 * written by an older version of the app. These parsers drop what they can't
 * understand rather than letting a bad shape crash the render.
 */
export function parseTodos(value: unknown): Todo[] | null {
  if (!Array.isArray(value)) return null;

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = asString(item.id);
    if (!id) return [];

    const done = item.done === true;
    return [
      {
        id,
        title: asString(item.title),
        done,
        dueDate: asNullableDate(item.dueDate),
        createdAt: asString(item.createdAt, new Date(0).toISOString()),
        completedAt: done ? asNullableDate(item.completedAt) : null,
      },
    ];
  });
}

export function parseNotes(value: unknown): Note[] | null {
  if (!Array.isArray(value)) return null;

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = asString(item.id);
    if (!id) return [];

    const createdAt = asString(item.createdAt, new Date(0).toISOString());
    return [
      {
        id,
        title: asString(item.title),
        body: asString(item.body),
        createdAt,
        updatedAt: asString(item.updatedAt, createdAt),
      },
    ];
  });
}
