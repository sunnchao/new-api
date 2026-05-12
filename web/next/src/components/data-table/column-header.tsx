"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div
        className={cn(
          "text-xs font-medium uppercase tracking-wide text-[var(--muted)]",
          className
        )}
      >
        {title}
      </div>
    );
  }

  const sorted = column.getIsSorted();
  const SortIcon =
    sorted === "desc" ? ArrowDown : sorted === "asc" ? ArrowUp : ArrowUpDown;

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "-ml-2 h-8 gap-1.5 px-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)] hover:text-[var(--foreground)] data-[state=open]:bg-[var(--surface)] data-[state=open]:text-[var(--foreground)]",
              sorted && "text-[var(--foreground)]"
            )}
          >
            <span>{title}</span>
            <SortIcon
              className={cn(
                "h-3.5 w-3.5 transition-opacity",
                sorted ? "opacity-100" : "opacity-50"
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-[var(--muted)]" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-[var(--muted)]" />
            Desc
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
              >
                <EyeOff className="mr-2 h-3.5 w-3.5 text-[var(--muted)]" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
