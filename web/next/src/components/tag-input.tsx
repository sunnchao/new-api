"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
  className,
  disabled,
}: TagInputProps) {
  const [draft, setDraft] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,$/g, "").trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (index: number) => {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft.length === 0 && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (next.endsWith(",")) {
      addTag(next.slice(0, -1));
    } else {
      setDraft(next);
    }
  };

  const filteredSuggestions = React.useMemo(() => {
    if (!suggestions) return [];
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, draft, value]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm shadow-sm focus-within:ring-2 focus-within:ring-[var(--accent)]",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--foreground)]"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              aria-label={`Remove ${tag}`}
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // delay to allow suggestion click
            setTimeout(() => {
              if (draft) addTag(draft);
            }, 120);
          }}
          placeholder={value.length === 0 ? placeholder : undefined}
          disabled={disabled}
          className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-[var(--muted)]"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-md border border-[var(--border)] bg-[var(--background)] p-1 shadow-md">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
                setShowSuggestions(false);
              }}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-left hover:bg-[var(--surface)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
