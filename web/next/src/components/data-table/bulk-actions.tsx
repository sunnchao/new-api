"use client";

import * as React from "react";
import { Download, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface BulkActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedCount: number;
  onDelete?: () => void;
  onExport?: () => void;
  onClearSelection: () => void;
  children?: React.ReactNode;
}

export const BulkActions = React.forwardRef<HTMLDivElement, BulkActionsProps>(
  (
    {
      selectedCount,
      onDelete,
      onExport,
      onClearSelection,
      children,
      className,
      ...props
    },
    ref
  ) => {
    if (selectedCount <= 0) return null;

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Bulk actions"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-2 py-1.5 shadow-lg backdrop-blur-md",
            "supports-[backdrop-filter]:bg-[var(--surface)]/70"
          )}
        >
          <div className="flex items-center gap-2 pl-3 pr-1 text-xs text-[var(--foreground)]">
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-medium text-[var(--accent-foreground)]">
              {selectedCount}
            </span>
            <span className="text-[var(--muted)]">selected</span>
          </div>

          <span className="h-5 w-px bg-[var(--border)]" />

          {children}

          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full text-xs"
              onClick={onExport}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full text-xs text-[var(--destructive)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}

          <span className="h-5 w-px bg-[var(--border)]" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }
);
BulkActions.displayName = "BulkActions";
