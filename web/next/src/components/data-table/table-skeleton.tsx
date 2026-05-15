"use client";

import * as React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TableSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  /** TanStack Table instance — used to derive column count if `columns` not provided */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table?: TanstackTable<any>;
  /** Key prefix for stable React keys */
  keyPrefix?: string;
}

export const TableSkeleton = React.forwardRef<
  HTMLDivElement,
  TableSkeletonProps
>(
  (
    { rows = 5, columns: columnsProp, showHeader = true, table, keyPrefix, className, ...props },
    ref
  ) => {
    const columns = columnsProp ?? (table ? table.getState().columnOrder?.length || table.getHeaderGroups().reduce((acc, hg) => acc + hg.headers.length, 0) : 4);
    const prefix = keyPrefix ?? 'skel';
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/30",
          className
        )}
        {...props}
      >
        <Table>
          {showHeader && (
            <TableHeader className="bg-[var(--surface)]/60">
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                {Array.from({ length: columns }).map((_, i) => (
                  <TableHead
                    key={`${prefix}-th-${i}`}
                    className="h-11 px-3 text-xs uppercase tracking-wide"
                  >
                    <Skeleton className="h-3 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {Array.from({ length: rows }).map((_, r) => (
              <TableRow
                key={`${prefix}-row-${r}`}
                className="border-[var(--border)] hover:bg-transparent"
              >
                {Array.from({ length: columns }).map((__, c) => (
                  <TableCell key={`${prefix}-cell-${r}-${c}`} className="px-3 py-3">
                    <Skeleton
                      className={cn(
                        "h-4",
                        c === 0 ? "w-[70%]" : c === columns - 1 ? "w-[40%]" : "w-[60%]"
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
);
TableSkeleton.displayName = "TableSkeleton";
