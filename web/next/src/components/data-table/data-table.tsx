"use client";

/**
 * DataTable — Dark Minimal reusable data table powered by @tanstack/react-table.
 *
 * Example usage:
 *
 *   import { DataTable } from "@/components/data-table/data-table";
 *   import { DataTableColumnHeader } from "@/components/data-table/column-header";
 *   import { DataTableToolbar } from "@/components/data-table/toolbar";
 *   import type { ColumnDef } from "@tanstack/react-table";
 *
 *   type User = { id: string; name: string; role: "admin" | "user" };
 *
 *   const columns: ColumnDef<User>[] = [
 *     {
 *       accessorKey: "name",
 *       header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
 *     },
 *     {
 *       accessorKey: "role",
 *       header: "Role",
 *       filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
 *     },
 *   ];
 *
 *   <DataTable
 *     columns={columns}
 *     data={users}
 *     enableSelection
 *     enableColumnVisibility
 *     rightToolbar={<Button size="sm">New</Button>}
 *   />
 */

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "./pagination";
import { DataTableViewOptions } from "./view-options";
import { TableEmpty } from "./table-empty";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  enableSelection?: boolean;
  enableColumnVisibility?: boolean;
  rightToolbar?: React.ReactNode;
  className?: string;
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  emptyState,
  onRowClick,
  enableSelection = true,
  enableColumnVisibility,
  rightToolbar,
  className,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize },
    },
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const showToolbar = enableColumnVisibility || Boolean(rightToolbar);
  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">{rightToolbar}</div>
          {enableColumnVisibility && <DataTableViewOptions table={table} />}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/30">
        <Table>
          <TableHeader className="bg-[var(--surface)]/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-[var(--border)] hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                    className="h-11 px-3 text-xs uppercase tracking-wide text-[var(--muted)]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows
                rows={pageSize}
                columns={table.getAllLeafColumns().length}
              />
            ) : hasRows ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    "border-[var(--border)] transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3 py-2.5 text-sm text-[var(--foreground)]"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="p-0"
                >
                  {emptyState ?? <TableEmpty />}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

function TableSkeletonRows({
  rows,
  columns,
}: {
  rows: number;
  columns: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow
          key={`skeleton-${rowIdx}`}
          className="border-[var(--border)] hover:bg-transparent"
        >
          {Array.from({ length: columns }).map((__, colIdx) => (
            <TableCell key={`skeleton-${rowIdx}-${colIdx}`} className="px-3 py-3">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// Re-export for convenience
export type { ColumnDef } from "@tanstack/react-table";
