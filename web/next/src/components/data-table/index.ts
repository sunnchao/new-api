"use client";

export { BulkActions, BulkActions as DataTableBulkActions } from "./bulk-actions";
export { DataTableColumnHeader } from "./column-header";
export { DataTable } from "./data-table";
export type { DataTableProps, ColumnDef } from "./data-table";
export { DataTableFacetedFilter } from "./faceted-filter";
export type { FacetedFilterOption } from "./faceted-filter";
export { MobileCardList } from "./mobile-card-list";
export { DataTablePagination } from "./pagination";
export { TableEmpty } from "./table-empty";
export { TableSkeleton } from "./table-skeleton";
export { DataTableToolbar } from "./toolbar";
export type { DataTableToolbarFilterDef, DataTableToolbarProps } from "./toolbar";
export { DataTableViewOptions } from "./view-options";

export const DISABLED_ROW_DESKTOP =
  "bg-[var(--surface)]/65 opacity-75 [&>td:first-child]:border-l-4 [&>td:first-child]:border-l-[var(--muted)]";

export const DISABLED_ROW_MOBILE =
  "border-l-4 border-l-[var(--muted)] bg-[var(--surface)]/65 opacity-75";
