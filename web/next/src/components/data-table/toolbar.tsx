"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "./faceted-filter";
import { DataTableViewOptions } from "./view-options";

export interface DataTableToolbarFilterDef {
  column: string;
  title: string;
  options: FacetedFilterOption[];
}

export interface DataTableToolbarProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filters?: DataTableToolbarFilterDef[];
  rightActions?: React.ReactNode;
  showViewOptions?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  filters,
  rightActions,
  showViewOptions = true,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const searchColumn = searchKey ? table.getColumn(searchKey) : undefined;
  const searchValue = (searchColumn?.getFilterValue() as string) ?? "";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-center md:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchColumn && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={searchValue}
              onChange={(event) =>
                searchColumn.setFilterValue(event.target.value)
              }
              placeholder={searchPlaceholder}
              className="h-8 w-full pl-8 text-sm md:w-[240px] lg:w-[280px]"
            />
          </div>
        )}

        {filters?.map((filter) => {
          const col = table.getColumn(filter.column);
          if (!col) return null;
          return (
            <DataTableFacetedFilter
              key={filter.column}
              column={col}
              title={filter.title}
              options={filter.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-8 gap-1.5 px-2 text-xs"
          >
            Reset
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightActions}
        {showViewOptions && <DataTableViewOptions table={table} />}
      </div>
    </div>
  );
}
