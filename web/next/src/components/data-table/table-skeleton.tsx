"use client";

import * as React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  /** TanStack Table instance — used to derive column count if `columns` not provided */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table?: TanstackTable<any>;
  /** Key prefix for stable React keys */
  keyPrefix?: string;
}

/**
 * Renders skeleton `<tr>` rows to be placed directly inside an existing `<TableBody>`.
 * Does NOT render its own wrapping div or Table — callers own that structure.
 */
export function TableSkeleton({
  rows = 5,
  columns: columnsProp,
  table,
  keyPrefix,
}: TableSkeletonProps) {
  const columns =
    columnsProp ??
    (table
      ? table.getState().columnOrder?.length ||
        table
          .getHeaderGroups()
          .reduce((acc, hg) => acc + hg.headers.length, 0)
      : 4);
  const prefix = keyPrefix ?? "skel";

  return (
    <>
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
                  c === 0
                    ? "w-[70%]"
                    : c === columns - 1
                      ? "w-[40%]"
                      : "w-[60%]"
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
TableSkeleton.displayName = "TableSkeleton";
