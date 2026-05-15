"use client";

import * as React from "react";
import { flexRender, type Row, type Table as TanstackTable } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { TableEmpty } from "./table-empty";
import { Skeleton } from "@/components/ui/skeleton";

export interface MobileCardListProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  data?: TData[];
  renderItem?: (item: TData, index: number) => React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  /**
   * Controls viewport visibility. By default the list is visible on small
   * screens and hidden at `md` and up. Set to `"always"` to render at all
   * breakpoints.
   */
  visibility?: "mobile" | "always";

  /** Props below are accepted for DataTablePage compatibility */

  /** TanStack Table instance (alternative to data + renderItem) */
  table?: TanstackTable<TData>;
  /** Loading state alias (same as `loading`) */
  isLoading?: boolean;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Row key resolver */
  getRowKey?: (row: Row<TData>) => string | number;
  /** Row className resolver */
  getRowClassName?: (row: Row<TData>) => string | undefined;
}

export function MobileCardList<TData>({
  data,
  renderItem,
  loading,
  isLoading,
  loadingRows = 4,
  emptyState,
  emptyTitle,
  emptyDescription,
  getRowKey,
  getRowClassName,
  table,
  visibility = "mobile",
  className,
  ...props
}: MobileCardListProps<TData>) {
  const visibilityClass =
    visibility === "mobile" ? "md:hidden" : undefined;

  const effectiveLoading = loading ?? isLoading;

  // Derive data from table if provided and data not given
  const effectiveData = data ?? (table?.getRowModel()?.rows?.map((r) => r.original) ?? []);

  if (effectiveLoading) {
    return (
      <div
        className={cn("flex flex-col gap-2", visibilityClass, className)}
        {...props}
      >
        {Array.from({ length: loadingRows }).map((_, i) => (
          <div
            key={`m-skel-${i}`}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 p-3"
          >
            <Skeleton className="mb-2 h-4 w-[60%]" />
            <Skeleton className="mb-1.5 h-3 w-[85%]" />
            <Skeleton className="h-3 w-[45%]" />
          </div>
        ))}
      </div>
    );
  }

  if (!effectiveData || effectiveData.length === 0) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/30",
          visibilityClass,
          className
        )}
        {...props}
      >
        {emptyState ?? <TableEmpty title={emptyTitle} description={emptyDescription} />}
      </div>
    );
  }

  // If we have a table, use its rows for rendering
  if (table && !renderItem) {
    const rows = table.getRowModel().rows;
    return (
      <div
        className={cn("flex flex-col gap-2", visibilityClass, className)}
        {...props}
      >
        {rows.map((row, index) => (
          <div
            key={getRowKey ? getRowKey(row) : row.id}
            className={cn(
              "rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 p-3 transition-colors hover:bg-[var(--surface)]/60",
              getRowClassName?.(row)
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <div key={cell.id} className="text-sm">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-2", visibilityClass, className)}
      {...props}
    >
      {effectiveData.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 p-3 transition-colors hover:bg-[var(--surface)]/60"
        >
          {renderItem?.(item, index)}
        </div>
      ))}
    </div>
  );
}
