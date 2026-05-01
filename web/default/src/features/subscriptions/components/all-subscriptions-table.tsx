import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTablePagination,
  TableSkeleton,
  TableEmpty,
} from '@/components/data-table'
import { PageFooterPortal } from '@/components/layout'
import { StatusBadge, type StatusBadgeProps } from '@/components/status-badge'
import { getAllUserSubscriptions, getAdminPlans } from '../api'
import { formatBillingMode, formatTimestamp } from '../lib'
import type { AdminUserSubscriptionOverview } from '../types'

// Matches the old SubscriptionOverviewPage status config
const STATUS_CONFIG: Record<string, { variant: StatusBadgeProps['variant'] }> =
  {
    active: { variant: 'success' },
    expired: { variant: 'neutral' },
    cancelled: { variant: 'warning' },
    exhausted: { variant: 'danger' },
  }

function useAllSubscriptionsColumns() {
  const { t } = useTranslation()

  return useMemo(
    (): ColumnDef<AdminUserSubscriptionOverview>[] => [
      {
        id: 'user_id',
        accessorFn: (row) => row.user_id,
        header: t('User ID'),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>{row.original.user_id}</span>
        ),
        size: 70,
      },
      {
        id: 'user',
        accessorFn: (row) => row.username,
        header: t('User'),
        cell: ({ row }) => (
          <div className='min-w-0'>
            <div className='truncate font-medium'>
              {row.original.username || '-'}
              {row.original.user_display_name && (
                <span className='text-muted-foreground ml-1 text-xs'>
                  ({row.original.user_display_name})
                </span>
              )}
            </div>
            <div className='text-muted-foreground truncate text-xs'>
              {row.original.user_email || '-'}
            </div>
          </div>
        ),
        size: 180,
      },
      {
        id: 'user_group',
        accessorFn: (row) => row.user_group,
        header: t('User Group'),
        cell: ({ row }) => (
          <StatusBadge variant='neutral'>
            {row.original.user_group || 'default'}
          </StatusBadge>
        ),
        size: 90,
      },
      {
        id: 'plan',
        accessorFn: (row) => row.plan_title,
        header: t('Plan'),
        cell: ({ row }) => (
          <div>
            <div className='font-medium'>{row.original.plan_title || '-'}</div>
            <div className='text-muted-foreground text-xs'>
              ID: {row.original.plan_id}
            </div>
          </div>
        ),
        size: 140,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: t('Status'),
        cell: ({ row }) => {
          const status = row.original.status
          const config = STATUS_CONFIG[status] || {
            variant: 'neutral' as const,
          }
          const labelMap: Record<string, string> = {
            active: t('Active (status)'),
            expired: t('Expired'),
            cancelled: t('Cancelled'),
            exhausted: t('Exhausted'),
          }
          return (
            <StatusBadge variant={config.variant}>
              {labelMap[status] || status}
            </StatusBadge>
          )
        },
        size: 80,
      },
      {
        id: 'billing_mode',
        accessorFn: (row) => row.billing_mode,
        header: t('Billing Mode'),
        cell: ({ row }) => (
          <StatusBadge
            variant={
              row.original.billing_mode === 'request' ? 'info' : 'neutral'
            }
          >
            {formatBillingMode(row.original.billing_mode, t)}
          </StatusBadge>
        ),
        size: 100,
      },
      {
        id: 'quota',
        header: t('Quota'),
        cell: ({ row }) => {
          const r = row.original
          const {
            amount_total,
            amount_used,
            amount_remaining,
            approximate_times,
            approximate_times_used,
          } = r
          const isUnlimited = !amount_total || amount_total <= 0
          const isRequest = r.billing_mode === 'request'

          // Format amounts: request-based shows raw counts, quota-based uses formatQuota
          const fmt = (v: number) =>
            isRequest ? v.toLocaleString() + t('times') : formatQuota(v)

          if (isUnlimited) {
            return (
              <div className='text-xs'>
                <StatusBadge variant='neutral'>{t('Unlimited')}</StatusBadge>
                <span className='text-muted-foreground ml-1'>
                  {t('Used')} {fmt(amount_used || 0)}
                </span>
              </div>
            )
          }

          const pct = Math.round((amount_used / amount_total) * 100)

          return (
            <div className='min-w-[120px] text-xs'>
              <div className='flex items-center gap-1'>
                <span className='font-medium'>{fmt(amount_remaining)}</span>
                <span className='text-muted-foreground'>
                  / {fmt(amount_total)}
                </span>
                <StatusBadge variant='neutral'>{pct}%</StatusBadge>
              </div>
              <div className='bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    pct > 90
                      ? 'bg-destructive'
                      : pct > 70
                        ? 'bg-warning'
                        : 'bg-success'
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {approximate_times > 0 && (
                <div className='text-muted-foreground mt-0.5'>
                  {t('Approx.')}{' '}
                  {(approximate_times_used || 0).toLocaleString()}/
                  {approximate_times.toLocaleString()}
                  {t('times')}
                </div>
              )}
            </div>
          )
        },
        size: 180,
      },
      {
        id: 'rate_limits',
        header: t('Quota Limits'),
        cell: ({ row }) => {
          const r = row.original
          const isRequest = r.billing_mode === 'request'
          const items: {
            key: string
            label: string
            used: number
            limit: number
            mode?: string
            nextResetTime?: number
          }[] = []

          if (r.hourly_limit_amount > 0) {
            items.push({
              key: 'hourly',
              label: `${t('Every')}${r.hourly_limit_hours || 1}${t('hours')}`,
              used: r.hourly_amount_used,
              limit: r.hourly_limit_amount,
              mode: r.hourly_reset_mode,
              nextResetTime: r.hourly_next_reset_time,
            })
          }
          if (r.daily_limit_amount > 0) {
            items.push({
              key: 'daily',
              label: t('Daily'),
              used: r.daily_amount_used,
              limit: r.daily_limit_amount,
              mode: r.daily_reset_mode,
              nextResetTime: r.daily_next_reset_time,
            })
          }
          if (r.weekly_limit_amount > 0) {
            items.push({
              key: 'weekly',
              label: t('Weekly'),
              used: r.weekly_amount_used,
              limit: r.weekly_limit_amount,
              mode: r.weekly_reset_mode,
              nextResetTime: r.weekly_next_reset_time,
            })
          }
          if (r.monthly_limit_amount > 0) {
            items.push({
              key: 'monthly',
              label: t('Monthly'),
              used: r.monthly_amount_used,
              limit: r.monthly_limit_amount,
              mode: r.monthly_reset_mode,
              nextResetTime: r.monthly_next_reset_time,
            })
          }

          if (items.length === 0) {
            return (
              <span className='text-muted-foreground text-xs'>
                {t('No Limits')}
              </span>
            )
          }

          // Format amounts: request-based shows raw counts, quota-based uses formatQuota
          const fmt = (v: number) =>
            isRequest ? v.toLocaleString() + t('times') : formatQuota(v)

          return (
            <div className='space-y-1 text-xs'>
              {items.map((item) => {
                return (
                  <div key={item.key}>
                    <div className='flex items-center gap-1'>
                      <span className='text-muted-foreground shrink-0'>
                        {item.label}
                      </span>
                      <span>
                        {fmt(item.used)} / {fmt(item.limit)}
                      </span>
                    </div>
                    {(item.nextResetTime || 0) > 0 && (
                      <div className='text-muted-foreground'>
                        {t('Next Reset')}{' '}
                        {formatTimestamp(item.nextResetTime || 0)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        },
        size: 200,
      },
      {
        id: 'allowed_groups',
        header: t('Group Permissions'),
        cell: ({ row }) => {
          const allowed = row.original.allowed_groups
          if (!allowed) {
            return (
              <StatusBadge variant='success'>{t('All Groups')}</StatusBadge>
            )
          }
          const groups = allowed
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
          return (
            <div className='flex flex-wrap gap-1'>
              {groups.map((g) => (
                <StatusBadge key={g} variant='info'>
                  {g}
                </StatusBadge>
              ))}
            </div>
          )
        },
        size: 120,
      },
      {
        id: 'start_time',
        accessorFn: (row) => row.start_time,
        header: t('Start Time'),
        cell: ({ row }) => (
          <span className='text-xs'>
            {formatTimestamp(row.original.start_time)}
          </span>
        ),
        size: 150,
      },
      {
        id: 'end_time',
        accessorFn: (row) => row.end_time,
        header: t('End Time'),
        cell: ({ row }) => (
          <span className='text-xs'>
            {formatTimestamp(row.original.end_time)}
          </span>
        ),
        size: 150,
      },
    ],
    [t]
  )
}

export function AllSubscriptionsTable() {
  const { t } = useTranslation()
  const columns = useAllSubscriptionsColumns()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [username, setUsername] = useState('')
  const [planIdFilter, setPlanIdFilter] = useState('__all__')
  const [statusFilter, setStatusFilter] = useState('__all__')
  const [groupFilter, setGroupFilter] = useState('')

  // Debounced username for API calls
  const [debouncedUsername, setDebouncedUsername] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username), 300)
    return () => clearTimeout(timer)
  }, [username])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedUsername, planIdFilter, statusFilter, groupFilter])

  // Load plans for filter dropdown
  const { data: plansData } = useQuery({
    queryKey: ['admin-subscription-plans-for-filter'],
    queryFn: async () => {
      const result = await getAdminPlans()
      return result.data || []
    },
  })

  const planOptions = useMemo(() => {
    const opts = [{ value: '__all__', label: t('All Plans') }]
    if (plansData) {
      for (const p of plansData) {
        opts.push({
          value: String(p.plan.id),
          label: p.plan.title || `Plan ${p.plan.id}`,
        })
      }
    }
    return opts
  }, [plansData, t])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'admin-all-subscriptions',
      page,
      pageSize,
      debouncedUsername,
      planIdFilter,
      statusFilter,
      groupFilter,
      t,
    ],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      }
      if (debouncedUsername) params.username = debouncedUsername
      if (planIdFilter && planIdFilter !== '__all__')
        params.plan_id = Number(planIdFilter)
      if (statusFilter && statusFilter !== '__all__')
        params.status = statusFilter
      if (groupFilter) params.user_group = groupFilter

      const result = await getAllUserSubscriptions(params)
      if (!result?.success) {
        toast.error(result?.message || t('Failed to load subscriptions'))
        return { data: [], total: 0, page: 1, page_size: 20 }
      }
      return result.data || { data: [], total: 0, page: 1, page_size: 20 }
    },
    placeholderData: (prev) => prev,
  })

  const subscriptions = useMemo(() => data?.data || [], [data])
  const total = data?.total || 0
  const isLoadingData = isLoading || (isFetching && !data)

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    state: {
      pagination: { pageIndex: page - 1, pageSize },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize })
          : updater
      setPage(next.pageIndex + 1)
      setPageSize(next.pageSize)
    },
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    if (pageCount > 0 && page > pageCount) {
      setPage(pageCount || 1)
    }
  }, [pageCount, page])

  const handleResetFilters = () => {
    setUsername('')
    setPlanIdFilter('__all__')
    setStatusFilter('__all__')
    setGroupFilter('')
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder={t('Search username or email')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className='h-8 w-[200px]'
        />
        <Select value={planIdFilter} onValueChange={setPlanIdFilter}>
          <SelectTrigger className='h-8 w-[150px]'>
            <SelectValue placeholder={t('Plan')} />
          </SelectTrigger>
          <SelectContent>
            {planOptions.map((opt) => (
              <SelectItem key={opt.value || '__all__'} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='h-8 w-[120px]'>
            <SelectValue placeholder={t('Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__all__'>{t('All Status')}</SelectItem>
            <SelectItem value='active'>{t('Active (status)')}</SelectItem>
            <SelectItem value='expired'>{t('Expired')}</SelectItem>
            <SelectItem value='cancelled'>{t('Cancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t('User Group')}
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className='h-8 w-[120px]'
        />
        <button
          type='button'
          className='text-muted-foreground hover:text-foreground text-xs'
          onClick={handleResetFilters}
        >
          {t('Reset')}
        </button>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-md border'>
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
            {isLoadingData ? (
              <TableSkeleton table={table} keyPrefix='all-subs-skeleton' />
            ) : table.getRowModel().rows.length === 0 ? (
              <TableEmpty
                colSpan={columns.length}
                title={t('No subscriptions found')}
                description={t(
                  'No user subscriptions match the current filters'
                )}
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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

      <PageFooterPortal>
        <DataTablePagination table={table} />
      </PageFooterPortal>
    </div>
  )
}
