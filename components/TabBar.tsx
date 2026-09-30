"use client";

import type { Tab } from "@/lib/types";

const TABS: { id: Tab; label: string }[] = [
  { id: "todos", label: "Tasks" },
  { id: "notes", label: "Notes" },
];

export function TabBar({
  active,
  counts,
  onChange,
}: {
  active: Tab;
  counts: Record<Tab, number>;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tasks and notes"
      className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? "bg-accent text-white"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs ${selected ? "text-white/70" : "text-muted"}`}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
