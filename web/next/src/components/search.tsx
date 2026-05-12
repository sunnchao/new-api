"use client";

import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommandMenu } from "@/components/command-menu";

export interface SearchProps {
  className?: string;
  placeholder?: string;
}

function getShortcutLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl K";
  const isMac =
    /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
    /Mac/.test(navigator.userAgent);
  return isMac ? "⌘K" : "Ctrl K";
}

export function Search({ className, placeholder = "Search..." }: SearchProps) {
  const { setOpen } = useCommandMenu();
  const [shortcut, setShortcut] = React.useState<string>("");

  React.useEffect(() => {
    setShortcut(getShortcutLabel());
  }, []);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command menu"
      className={cn(
        "inline-flex h-9 w-full min-w-[12rem] max-w-xs items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)]/50 px-3 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        className
      )}
    >
      <SearchIcon className="h-4 w-4" />
      <span className="flex-1 text-left">{placeholder}</span>
      {shortcut ? (
        <kbd className="inline-flex items-center rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)]">
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}
