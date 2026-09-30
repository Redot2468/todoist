"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

/**
 * `localStorage` is an external store, so it is read through
 * `useSyncExternalStore` rather than an effect that calls `setState`. Two
 * things fall out of that for free: React uses the server snapshot during
 * hydration (so there is no markup mismatch), and a `storage` event from
 * another tab can invalidate the cache and re-render every subscriber.
 *
 * Snapshots are cached per key because `getSnapshot` must return a
 * referentially stable value between renders or React will loop.
 */
const snapshots = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

let storageListenerAttached = false;

function emit(key: string) {
  const subscribers = listeners.get(key);
  if (subscribers) for (const listener of subscribers) listener();
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === "undefined") return;
  storageListenerAttached = true;

  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      // Storage was cleared wholesale.
      snapshots.clear();
      for (const key of listeners.keys()) emit(key);
      return;
    }
    if (!snapshots.has(event.key)) return;
    // Drop the stale snapshot; the next read re-parses from storage.
    snapshots.delete(event.key);
    emit(event.key);
  });
}

function subscribe(key: string, listener: Listener): () => void {
  attachStorageListener();

  let subscribers = listeners.get(key);
  if (!subscribers) {
    subscribers = new Set();
    listeners.set(key, subscribers);
  }
  subscribers.add(listener);

  return () => {
    subscribers.delete(listener);
  };
}

function readSnapshot<T>(
  key: string,
  initial: T,
  parse: (value: unknown) => T | null,
): T {
  const cached = snapshots.get(key);
  if (cached !== undefined) return cached as T;

  let value = initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      const parsed = parse(JSON.parse(raw));
      if (parsed !== null) value = parsed;
    }
  } catch {
    // Corrupt JSON, or storage blocked entirely (Safari private mode).
    // Falling back to `initial` keeps the app usable either way.
  }

  snapshots.set(key, value);
  return value;
}

function writeSnapshot<T>(key: string, next: T) {
  snapshots.set(key, next);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Over quota or storage disabled — the session continues in memory.
  }
  emit(key);
}

/**
 * `hydrated` is false for the server render and the hydration render, then
 * true. Callers use it to hold off on empty states instead of flashing
 * "nothing here yet" over data that is about to appear.
 */
const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useLocalStorage<T>(
  key: string,
  initial: T,
  parse: (value: unknown) => T | null,
) {
  const value = useSyncExternalStore(
    useCallback((listener: Listener) => subscribe(key, listener), [key]),
    () => readSnapshot(key, initial, parse),
    () => initial,
  );

  const setValue = useCallback(
    (updater: T | ((previous: T) => T)) => {
      const previous = readSnapshot(key, initial, parse);
      const next =
        typeof updater === "function"
          ? (updater as (previous: T) => T)(previous)
          : updater;
      writeSnapshot(key, next);
    },
    [key, initial, parse],
  );

  return [value, setValue, useHydrated()] as const;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
