import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMediaQuery } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota, formatTimestampToDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  MobileCardList,
  TableEmpty,
  TableSkeleton,
} from '@/components/data-table'
import { GroupBadge } from '@/components/group-badge'
import { PageFooterPortal } from '@/components/layout'
import { StatusBadge } from '@/components/status-badge'
import {
  API_KEY_STATUSES,
  API_KEY_STATUS_OPTIONS,
  ERROR_MESSAGES,
} from '@/features/keys/constants'
import { getAdminTokens, searchAdminTokens } from '../api'
import type { AdminToken } from '../types'

const route = getRouteApi('/_authenticated/admin-tokens/')

function getQuotaProgressColor(percentage: number): string {
  if (percentage <= 10) return '[&_[data-slot=progress-indicator]]:bg-rose-500'
  if (percentage <= 30) return '[&_[data-slot=progress-indicator]]:bg-amber-500'
  return '[&_[data-slot=progress-indicator]]:bg-emerald-500'
}

function parseGroupList(value?: string | null): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function AdminTokenKeyCell({ token }: { token: AdminToken }) {
  const maskedKey = token.key.startsWith('sk-') ? token.key : `sk-${token.key}`

  return (
    <span className='text-muted-foreground font-mono text-xs'>{maskedKey}</span>
  )
}

function useAdminTokenColumns(): ColumnDef<AdminToken>[] {
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Token Name')} />
        ),
        cell: ({ row }) => (
          <div className='max-w-[200px] truncate font-medium'>
            {row.getValue('name')}
          </div>
        ),
        meta: { label: t('Token Name'), mobileTitle: true },
      },
      {
        accessorKey: 'user_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('User')} />
        ),
        cell: ({ row }) => {
          const token = row.original
          return (
            <div className='max-w-[180px] leading-tight'>
              <div className='truncate font-medium'>
                {token.user_name || t('Unknown')}
              </div>
              <div className='text-muted-foreground font-mono text-xs'>
                #{token.user_id}
              </div>
            </div>
          )
        },
        meta: { label: t('User'), mobileBadge: true },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Status')} />
        ),
        cell: ({ row }) => {
          const statusConfig =
            API_KEY_STATUSES[row.getValue('status') as number]
          if (!statusConfig) return null
          return (
            <StatusBadge
              label={t(statusConfig.label)}
              variant={statusConfig.variant}
              showDot={statusConfig.showDot}
              copyable={false}
            />
          )
        },
        filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
        meta: { label: t('Status'), mobileBadge: true },
      },
      {
        id: 'key',
        accessorKey: 'key',
        header: t('API Key'),
        cell: ({ row }) => <AdminTokenKeyCell token={row.original} />,
        enableSorting: false,
        meta: { label: t('API Key') },
      },
      {
        id: 'quota',
        accessorKey: 'remain_quota',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Quota')} />
        ),
        cell: ({ row }) => {
          const token = row.original
          if (token.unlimited_quota) {
            return (
              <StatusBadge
                label={t('Unlimited')}
                variant='neutral'
                copyable={false}
              />
            )
          }

          const used = token.used_quota
          const remaining = token.remain_quota
          const total = used + remaining
          const percentage = total > 0 ? (remaining / total) * 100 : 0

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='w-[150px] space-y-1'>
                  <div className='flex justify-between text-xs'>
                    <span className='font-medium tabular-nums'>
                      {formatQuota(remaining)}
                    </span>
                    <span className='text-muted-foreground tabular-nums'>
                      {formatQuota(total)}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className={cn('h-1.5', getQuotaProgressColor(percentage))}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className='space-y-1 text-xs'>
                  <div>
                    {t('Used:')} {formatQuota(used)}
                  </div>
                  <div>
                    {t('Remaining:')} {formatQuota(remaining)} (
                    {percentage.toFixed(1)}%)
                  </div>
                  <div>
                    {t('Total:')} {formatQuota(total)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        },
        meta: { label: t('Quota') },
      },
      {
        accessorKey: 'group',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Group')} />
        ),
        cell: ({ row }) => {
          const token = row.original
          const group = row.getValue('group') as string
          const backupGroups = parseGroupList(token.backup_group)

          return (
            <span className='inline-flex max-w-[240px] flex-wrap items-center gap-1.5'>
              <GroupBadge group={group} />
              {backupGroups.map((backupGroup) => (
                <GroupBadge
                  key={backupGroup}
                  group={backupGroup}
                  className='opacity-70'
                />
              ))}
            </span>
          )
        },
        meta: { label: t('Group'), mobileHidden: true },
      },
      {
        accessorKey: 'created_time',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Created')} />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground font-mono text-xs tabular-nums'>
            {formatTimestampToDate(row.getValue('created_time'))}
          </span>
        ),
        meta: { label: t('Created'), mobileHidden: true },
      },
      {
        accessorKey: 'accessed_time',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Last Used')} />
        ),
        cell: ({ row }) => {
          const accessedTime = row.getValue('accessed_time') as number
          if (!accessedTime) {
            return <span className='text-muted-foreground text-xs'>-</span>
          }
          return (
            <span className='text-muted-foreground font-mono text-xs tabular-nums'>
              {formatTimestampToDate(accessedTime)}
            </span>
          )
        },
        meta: { label: t('Last Used'), mobileHidden: true },
      },
    ],
    [t]
  )
}

export function AdminTokensTable() {
  const { t } = useTranslation()
  const columns = useAdminTokenColumns()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [{ columnId: 'status', searchKey: 'status', type: 'array' }],
  })

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'admin-tokens',
      pagination.pageIndex + 1,
      pagination.pageSize,
      globalFilter,
    ],
    queryFn: async () => {
      const keyword = globalFilter?.trim() ?? ''
      const result = keyword
        ? await searchAdminTokens({
            keyword,
            p: pagination.pageIndex + 1,
            page_size: pagination.pageSize,
          })
        : await getAdminTokens({
            p: pagination.pageIndex + 1,
            page_size: pagination.pageSize,
          })

      if (!result.success) {
        toast.error(
          result.message ||
            t(
              keyword
                ? ERROR_MESSAGES.SEARCH_FAILED
                : ERROR_MESSAGES.LOAD_FAILED
            )
        )
        return { items: [], total: 0 }
      }

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const tokens = data?.items || []

  const table = useReactTable({
    data: tokens,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    globalFilterFn: (row, _columnId, filterValue) => {
      const value = String(filterValue).toLowerCase()
      const token = row.original

      return (
        token.name.toLowerCase().includes(value) ||
        token.key.toLowerCase().includes(value) ||
        String(token.user_id).includes(value) ||
        (token.user_name || '').toLowerCase().includes(value)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: Math.ceil((data?.total || 0) / pagination.pageSize),
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  return (
    <>
      <div className='space-y-4'>
        <div className='flex justify-end'>
          <DataTableToolbar
            table={table}
            searchPlaceholder={t('Filter by token name')}
            filters={[
              {
                columnId: 'status',
                title: t('Status'),
                options: API_KEY_STATUS_OPTIONS,
              },
            ]}
          />
        </div>
        {isMobile ? (
          <MobileCardList
            table={table}
            isLoading={isLoading}
            emptyTitle={t('No API Keys Found')}
            emptyDescription={t(
              'No API keys available. Create your first API key to get started.'
            )}
          />
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-md border transition-opacity duration-150',
              isFetching && !isLoading && 'pointer-events-none opacity-50'
            )}
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                {isLoading ? (
                  <TableSkeleton
                    table={table}
                    keyPrefix='admin-tokens-skeleton'
                  />
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableEmpty
                    colSpan={columns.length}
                    title={t('No API Keys Found')}
                    description={t(
                      'No API keys available. Create your first API key to get started.'
                    )}
                  />
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={
                        row.original.status !== 1 ? 'opacity-60' : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <PageFooterPortal>
        <DataTablePagination table={table} />
      </PageFooterPortal>
    </>
  )
}
