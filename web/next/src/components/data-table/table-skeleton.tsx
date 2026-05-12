"use client";

import * as React from "react";
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
}

export const TableSkeleton = React.forwardRef<
  HTMLDivElement,
  TableSkeletonProps
>(
  (
    { rows = 5, columns = 4, showHeader = true, className, ...props },
    ref
  ) => {
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
                    key={`th-${i}`}
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
                key={`row-${r}`}
                className="border-[var(--border)] hover:bg-transparent"
              >
                {Array.from({ length: columns }).map((__, c) => (
                  <TableCell key={`cell-${r}-${c}`} className="px-3 py-3">
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
