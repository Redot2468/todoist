"use client";

import { SearchIcon, XIcon } from "./Icons";
import { iconButton } from "./styles";

export function SearchBar({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onChange("");
        }}
        className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className={`${iconButton} absolute right-1.5 top-1/2 -translate-y-1/2`}
        >
          <XIcon />
        </button>
      ) : null}
    </div>
  );
}
