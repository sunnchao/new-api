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

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MultiSelect } from '@/components/multi-select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createPlan, updatePlan, getUserGroups } from '../api'
import type { AdminPlan, AdminPlanPayload } from '../types'

const DURATION_UNITS = ['day', 'week', 'month', 'quarter', 'year'] as const

const planFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  currency: z.string().default('USD'),
  total_quota: z.string().default('0'),
  is_unlimited_time: z.boolean().default(false),
  duration_value: z.string().default('1'),
  duration_unit: z.string().default('month'),
  daily_quota_per_plan: z.string().default('0'),
  weekly_quota_per_plan: z.string().default('0'),
  monthly_quota_per_plan: z.string().default('0'),
  reset_quota_limit: z.string().default('0'),
  deduction_group: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  show_in_portal: z.boolean().default(true),
})

type PlanFormValues = z.infer<typeof planFormSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan: AdminPlan | null
}

function toDecimalNumber(value: string): number {
  try {
    return new Decimal(value || '0').toNumber()
  } catch {
    return 0
  }
}

export function PlanDrawer({ open, onOpenChange, editingPlan }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const groupsQuery = useQuery({
    queryKey: ['admin-packages', 'user-groups'],
    queryFn: getUserGroups,
    enabled: open,
  })

  const groupOptions = useMemo(() => {
    const data = groupsQuery.data?.data
    if (!data) return [] as { label: string; value: string }[]
    return Object.entries(data).map(([value, meta]) => ({
      value,
      label: meta?.desc ? `${value} (${meta.desc})` : value,
    }))
  }, [groupsQuery.data])

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
      price: '0',
      currency: 'USD',
      total_quota: '0',
      is_unlimited_time: false,
      duration_value: '1',
      duration_unit: 'month',
      daily_quota_per_plan: '0',
      weekly_quota_per_plan: '0',
      monthly_quota_per_plan: '0',
      reset_quota_limit: '0',
      deduction_group: [],
      is_active: true,
      show_in_portal: true,
    },
  })

  useEffect(() => {
    if (!open) return
    if (editingPlan) {
      form.reset({
        name: editingPlan.name || '',
        type: editingPlan.type || '',
        description: editingPlan.description || '',
        price: String(editingPlan.price ?? 0),
        currency: editingPlan.currency || 'USD',
        total_quota: String(editingPlan.total_quota ?? 0),
        is_unlimited_time: editingPlan.is_unlimited_time ?? false,
        duration_value: String(editingPlan.duration_value ?? 1),
        duration_unit: editingPlan.duration_unit || 'month',
        daily_quota_per_plan: String(editingPlan.daily_quota_per_plan ?? 0),
        weekly_quota_per_plan: String(editingPlan.weekly_quota_per_plan ?? 0),
        monthly_quota_per_plan: String(editingPlan.monthly_quota_per_plan ?? 0),
        reset_quota_limit: String(editingPlan.reset_quota_limit ?? 0),
        deduction_group: editingPlan.deduction_group
          ? editingPlan.deduction_group.split(',').filter(Boolean)
          : [],
        is_active: editingPlan.is_active ?? true,
        show_in_portal: editingPlan.show_in_portal ?? true,
      })
    } else {
      form.reset()
    }
  }, [open, editingPlan, form])

  const mutation = useMutation({
    mutationFn: (payload: AdminPlanPayload) =>
      editingPlan ? updatePlan(editingPlan.id, payload) : createPlan(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(
          res.message || t(editingPlan ? 'Plan updated successfully' : 'Plan created successfully')
        )
        queryClient.invalidateQueries({ queryKey: ['admin-packages', 'plans'] })
        onOpenChange(false)
      } else {
        toast.error(res.message || t('Failed to save plan'))
      }
    },
    onError: () => toast.error(t('Failed to save plan')),
  })

  const onSubmit = (values: PlanFormValues) => {
    const payload: AdminPlanPayload = {
      name: values.name,
      type: values.type,
      description: values.description,
      price: toDecimalNumber(values.price),
      currency: values.currency,
      total_quota: toDecimalNumber(values.total_quota),
      is_unlimited_time: values.is_unlimited_time,
      duration_value: values.is_unlimited_time ? 0 : Number(values.duration_value) || 0,
      duration_unit: values.duration_unit,
      daily_quota_per_plan: toDecimalNumber(values.daily_quota_per_plan),
      weekly_quota_per_plan: toDecimalNumber(values.weekly_quota_per_plan),
      monthly_quota_per_plan: toDecimalNumber(values.monthly_quota_per_plan),
      reset_quota_limit: toDecimalNumber(values.reset_quota_limit),
      deduction_group: values.deduction_group.join(','),
      is_active: values.is_active,
      show_in_portal: values.show_in_portal,
    }
    mutation.mutate(payload)
  }

  const isUnlimited = form.watch('is_unlimited_time')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{editingPlan ? t('Edit Plan') : t('Create Plan')}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-4 pb-6'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Type')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g. pro, basic' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Price')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='number' step='0.01' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Currency')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='total_quota'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Quota')}</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='is_unlimited_time'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                  <FormLabel className='mb-0'>{t('Unlimited Duration')}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {!isUnlimited && (
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='duration_value'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Duration')}</FormLabel>
                      <FormControl>
                        <Input {...field} type='number' />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='duration_unit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Unit')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DURATION_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {t(u)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className='grid grid-cols-3 gap-3'>
              <FormField
                control={form.control}
                name='daily_quota_per_plan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>{t('Daily Quota Limit')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='number' />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='weekly_quota_per_plan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>{t('Weekly Quota Limit')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='number' />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='monthly_quota_per_plan'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>{t('Monthly Quota Limit')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='number' />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='deduction_group'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Deduction Group')}</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={groupOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('Select groups')}
                    />
                  </FormControl>
                  <FormDescription className='text-xs'>
                    {t('Groups whose quota this plan deducts from')}
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='is_active'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='mb-0'>{t('Active')}</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='show_in_portal'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='mb-0'>{t('Show in Portal')}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className='px-0'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                {t('Cancel')}
              </Button>
              <Button type='submit' disabled={mutation.isPending}>
                {t('Save')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
