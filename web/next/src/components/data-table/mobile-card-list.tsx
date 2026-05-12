"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TableEmpty } from "./table-empty";
import { Skeleton } from "@/components/ui/skeleton";

export interface MobileCardListProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  data: TData[];
  renderItem: (item: TData, index: number) => React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  /**
   * Controls viewport visibility. By default the list is visible on small
   * screens and hidden at `md` and up. Set to `"always"` to render at all
   * breakpoints.
   */
  visibility?: "mobile" | "always";
}

export function MobileCardList<TData>({
  data,
  renderItem,
  loading,
  loadingRows = 4,
  emptyState,
  visibility = "mobile",
  className,
  ...props
}: MobileCardListProps<TData>) {
  const visibilityClass =
    visibility === "mobile" ? "md:hidden" : undefined;

  if (loading) {
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

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/30",
          visibilityClass,
          className
        )}
        {...props}
      >
        {emptyState ?? <TableEmpty />}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-2", visibilityClass, className)}
      {...props}
    >
      {data.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 p-3 transition-colors hover:bg-[var(--surface)]/60"
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
