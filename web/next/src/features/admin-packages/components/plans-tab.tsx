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
import { MoreHorizontal, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatQuota } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAdminPlans, deletePlan } from '../api'
import type { AdminPlan } from '../types'
import { PlanDrawer } from './plan-drawer'

const DURATION_UNIT_LABEL: Record<string, string> = {
  day: 'days',
  month: 'months',
  year: 'year',
  hour: 'hours',
  custom: 'Custom (seconds)',
}

function formatQuotaLimit(value: number | undefined, unlimitedLabel: string) {
  return value && value > 0 ? formatQuota(value) : unlimitedLabel
}

export function PlansTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminPlan | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-packages', 'plans'],
    queryFn: getAdminPlans,
  })
  const plans: AdminPlan[] = data?.data || []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-packages', 'plans'] })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlan(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || t('Plan deleted successfully'))
        invalidate()
      } else {
        toast.error(res.message || t('Failed to delete plan'))
      }
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error(t('Failed to delete plan'))
      setDeleteTarget(null)
    },
  })

  const openCreate = () => {
    setEditingPlan(null)
    setDrawerOpen(true)
  }

  const openEdit = (plan: AdminPlan) => {
    setEditingPlan(plan)
    setDrawerOpen(true)
  }

  const formatDuration = (plan: AdminPlan) => {
    if (plan.is_unlimited_time) return t('Unlimited Duration')
    const unitKey = DURATION_UNIT_LABEL[plan.duration_unit || 'month']
    const unitLabel = unitKey ? t(unitKey) : plan.duration_unit || '-'
    return `${plan.duration_value || 0} ${unitLabel}`
  }

  let body
  if (isLoading) {
    body = (
      <div className='text-muted-foreground py-8 text-center'>
        {t('Loading')}...
      </div>
    )
  } else if (plans.length === 0) {
    body = (
      <div className='text-muted-foreground py-8 text-center'>
        {t('No plans found')}
      </div>
    )
  } else {
    body = (
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('Price')}</TableHead>
              <TableHead>{t('Quota')}</TableHead>
              <TableHead>{t('Daily Quota Limit')}</TableHead>
              <TableHead>{t('Weekly Quota Limit')}</TableHead>
              <TableHead>{t('Monthly Quota Limit')}</TableHead>
              <TableHead>{t('Duration')}</TableHead>
              <TableHead className='w-[50px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className='font-medium'>
                  {plan.name || plan.type}
                </TableCell>
                <TableCell className='font-mono text-xs'>{plan.type}</TableCell>
                <TableCell>
                  {plan.price} {plan.currency}
                </TableCell>
                <TableCell>{formatQuota(plan.total_quota)}</TableCell>
                <TableCell>
                  {formatQuotaLimit(plan.daily_quota_per_plan, t('Unlimited'))}
                </TableCell>
                <TableCell>
                  {formatQuotaLimit(plan.weekly_quota_per_plan, t('Unlimited'))}
                </TableCell>
                <TableCell>
                  {formatQuotaLimit(plan.monthly_quota_per_plan, t('Unlimited'))}
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {formatDuration(plan)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='size-8'>
                        <MoreHorizontal className='size-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEdit(plan)}>
                        {t('Edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() => setDeleteTarget(plan)}
                      >
                        <Trash2 className='mr-2 size-4' />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
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
        <Button size='sm' onClick={openCreate}>
          <Plus className='mr-2 size-4' />
          {t('Create Plan')}
        </Button>
      </div>

      {body}

      <PlanDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingPlan={editingPlan}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Plan')}
        description={t('Are you sure you want to delete this plan?')}
        destructive
        confirmText={t('Delete')}
        cancelText={t('Cancel')}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}
