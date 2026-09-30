import { dayDelta } from "./dates";
import type { Note, Todo, TodoFilter } from "./types";

export type TodoGroupKey = "overdue" | "today" | "upcoming" | "someday" | "completed";

export type TodoGroup = {
  key: TodoGroupKey;
  label: string;
  todos: Todo[];
};

const GROUP_LABELS: Record<TodoGroupKey, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  someday: "No due date",
  completed: "Completed",
};

const GROUP_ORDER: TodoGroupKey[] = [
  "overdue",
  "today",
  "upcoming",
  "someday",
  "completed",
];

/**
 * Completed todos get their own group rather than staying in their due-date
 * bucket — a finished task that happens to be past its date is done, not
 * overdue, and flagging it red would be a lie.
 */
function groupKeyFor(todo: Todo, todayDate: string): TodoGroupKey {
  if (todo.done) return "completed";
  if (!todo.dueDate) return "someday";

  const delta = dayDelta(todayDate, todo.dueDate);
  if (delta < 0) return "overdue";
  if (delta === 0) return "today";
  return "upcoming";
}

function compareWithin(key: TodoGroupKey, a: Todo, b: Todo): number {
  if (key === "completed") {
    return (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt);
  }
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate.localeCompare(b.dueDate);
  }
  return b.createdAt.localeCompare(a.createdAt);
}

export function groupTodos(todos: Todo[], todayDate: string): TodoGroup[] {
  const buckets = new Map<TodoGroupKey, Todo[]>();

  for (const todo of todos) {
    const key = groupKeyFor(todo, todayDate);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(todo);
    else buckets.set(key, [todo]);
  }

  return GROUP_ORDER.flatMap((key) => {
    const bucket = buckets.get(key);
    if (!bucket || bucket.length === 0) return [];
    return [
      {
        key,
        label: GROUP_LABELS[key],
        todos: [...bucket].sort((a, b) => compareWithin(key, a, b)),
      },
    ];
  });
}

export function applyFilter(todos: Todo[], filter: TodoFilter): Todo[] {
  if (filter === "active") return todos.filter((todo) => !todo.done);
  if (filter === "completed") return todos.filter((todo) => todo.done);
  return todos;
}

/** Case-insensitive substring match across the given fields. */
export function matchesQuery(query: string, ...fields: string[]): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field.toLowerCase().includes(needle));
}

export function searchTodos(todos: Todo[], query: string): Todo[] {
  return todos.filter((todo) => matchesQuery(query, todo.title));
}

export function searchNotes(notes: Note[], query: string): Note[] {
  return notes.filter((note) => matchesQuery(query, note.title, note.body));
}

export function countActive(todos: Todo[]): number {
  return todos.reduce((total, todo) => (todo.done ? total : total + 1), 0);
}
