"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";

export interface TableEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** Column span for table row usage */
  colSpan?: number;
  /** Children rendered as action area (alias for `action`) */
  children?: React.ReactNode;
  className?: string;
}

export const TableEmpty = React.forwardRef<HTMLTableRowElement, TableEmptyProps>(
  (
    {
      title = "No results",
      description = "Try adjusting your search or filters to find what you are looking for.",
      icon,
      action,
      colSpan = 1,
      children,
      className,
    },
    ref
  ) => {
    return (
      <TableRow ref={ref}>
        <TableCell colSpan={colSpan} className="p-0">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
              className
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/60 text-[var(--muted)]">
              {icon ?? <Inbox className="h-5 w-5" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {title}
              </p>
              {description && (
                <p className="mx-auto max-w-xs text-xs text-[var(--muted)]">
                  {description}
                </p>
              )}
            </div>
            {(action ?? children) && <div className="pt-1">{action ?? children}</div>}
          </div>
        </TableCell>
      </TableRow>
    );
  }
);
TableEmpty.displayName = "TableEmpty";
