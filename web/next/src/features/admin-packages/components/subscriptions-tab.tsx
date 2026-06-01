/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, RefreshCw, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatQuota, formatTimestamp } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { StatusBadge, type StatusVariant } from '@/components/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getAdminSubscriptions,
  cancelSubscription,
  deleteSubscription,
  updateResetLimit,
} from '../api'
import type { AdminSubscription } from '../types'
import { GrantSubscriptionDialog } from './grant-subscription-dialog'

const PAGE_SIZE = 10

const STATUS_VARIANT: Record<string, StatusVariant> = {
  active: 'success',
  expired: 'grey',
  cancelled: 'orange',
  exhausted: 'red',
  pending: 'blue',
}

const STATUS_LABEL_KEY: Record<string, string> = {
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
  exhausted: 'Exhausted',
  pending: 'Pending',
}

type ConfirmAction = {
  type: 'cancel' | 'delete'
  row: AdminSubscription
}

function userLabel(row: AdminSubscription): string {
  return (
    row.user?.email ||
    row.user?.username ||
    (row.user_id ? `#${row.user_id}` : '-')
  )
}

function planLabel(row: AdminSubscription): string {
  return row.package_plan?.name || row.package_plan?.type || row.plan_type || '-'
}

export function SubscriptionsTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [grantOpen, setGrantOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminSubscription | null>(null)
  const [resetValue, setResetValue] = useState('0')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-packages', 'subscriptions', page],
    queryFn: () => getAdminSubscriptions({ page, page_size: PAGE_SIZE }),
  })

  const subscriptions: AdminSubscription[] =
    data?.data?.subscriptions || data?.data?.items || []
  const total: number = data?.data?.total || 0

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ['admin-packages', 'subscriptions'],
    })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelSubscription(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || t('Subscription cancelled successfully'))
        invalidate()
      } else {
        toast.error(res.message || t('Failed to cancel subscription'))
      }
      setConfirmAction(null)
    },
    onError: () => {
      toast.error(t('Failed to cancel subscription'))
      setConfirmAction(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSubscription(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || t('Subscription deleted successfully'))
        invalidate()
      } else {
        toast.error(res.message || t('Failed to delete subscription'))
      }
      setConfirmAction(null)
    },
    onError: () => {
      toast.error(t('Failed to delete subscription'))
      setConfirmAction(null)
    },
  })

  const resetMutation = useMutation({
    mutationFn: ({ id, value }: { id: number; value: number }) =>
      updateResetLimit(id, { reset_quota_limit: value }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || t('Reset limit updated successfully'))
        invalidate()
      } else {
        toast.error(res.message || t('Failed to update reset limit'))
      }
      setResetTarget(null)
    },
    onError: () => {
      toast.error(t('Failed to update reset limit'))
      setResetTarget(null)
    },
  })

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'cancel') {
      cancelMutation.mutate(confirmAction.row.id)
    } else {
      deleteMutation.mutate(confirmAction.row.id)
    }
  }

  const openReset = (row: AdminSubscription) => {
    setResetTarget(row)
    setResetValue(String(row.reset_quota_limit ?? 0))
  }

  let body
  if (isLoading) {
    body = (
      <div className='text-muted-foreground py-8 text-center'>
        {t('Loading')}...
      </div>
    )
  } else if (subscriptions.length === 0) {
    body = (
      <div className='text-muted-foreground py-8 text-center'>
        {t('No subscriptions found')}
      </div>
    )
  } else {
    body = (
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('User')}</TableHead>
              <TableHead>{t('Plan')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Quota')}</TableHead>
              <TableHead>{t('Start Time')}</TableHead>
              <TableHead>{t('End Time')}</TableHead>
              <TableHead className='w-[50px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((row) => {
              const variant = STATUS_VARIANT[row.status] || 'neutral'
              const isClosed =
                row.status === 'expired' || row.status === 'cancelled'
              return (
                <TableRow key={row.id}>
                  <TableCell className='font-medium'>{userLabel(row)}</TableCell>
                  <TableCell>{planLabel(row)}</TableCell>
                  <TableCell>
                    <StatusBadge variant={variant} copyable={false}>
                      {t(STATUS_LABEL_KEY[row.status] || row.status)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className='text-sm'>
                    {formatQuota(row.remain_quota)} /{' '}
                    {formatQuota(row.total_quota)}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {formatTimestamp(row.start_time)}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {formatTimestamp(row.end_time)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='size-8'>
                          <MoreHorizontal className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => openReset(row)}>
                          {t('Update Reset Limit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isClosed}
                          onClick={() =>
                            setConfirmAction({ type: 'cancel', row })
                          }
                        >
                          {t('Cancel Subscription')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() =>
                            setConfirmAction({ type: 'delete', row })
                          }
                        >
                          {t('Delete Subscription')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={isFetching}
          onClick={() => invalidate()}
        >
          <RefreshCw className='mr-2 size-4' />
          {t('Refresh')}
        </Button>
        <Button size='sm' onClick={() => setGrantOpen(true)}>
          <Plus className='mr-2 size-4' />
          {t('Grant Subscription')}
        </Button>
      </div>

      {body}

      {total > PAGE_SIZE && (
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>
            {t('Total')}: {total}
          </span>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              {t('Previous')}
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage(page + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      )}

      <GrantSubscriptionDialog open={grantOpen} onOpenChange={setGrantOpen} />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'cancel'
            ? t('Cancel Subscription')
            : t('Delete Subscription')
        }
        description={
          confirmAction?.type === 'cancel'
            ? t('Are you sure you want to cancel this subscription?')
            : t('Are you sure you want to delete this subscription?')
        }
        destructive
        confirmText={
          confirmAction?.type === 'cancel' ? t('Confirm') : t('Delete')
        }
        cancelText={t('Cancel')}
        isLoading={cancelMutation.isPending || deleteMutation.isPending}
        onConfirm={handleConfirm}
      />

      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('Update Reset Limit')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t('Resettable Count')}
            </label>
            <Input
              type='number'
              min={0}
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setResetTarget(null)}>
              {t('Cancel')}
            </Button>
            <Button
              disabled={resetMutation.isPending}
              onClick={() =>
                resetTarget &&
                resetMutation.mutate({
                  id: resetTarget.id,
                  value: Math.max(Number(resetValue || 0), 0),
                })
              }
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
