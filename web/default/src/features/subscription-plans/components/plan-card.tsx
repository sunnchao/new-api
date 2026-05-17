/*
Copyright (C) 2023-2026 QuantumNous

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
import { Link } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { ArrowRight, Check, Clock, Layers, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrencyUSD, formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import {
  formatBillingMode,
  formatDuration,
  formatResetPeriod,
  formatSubscriptionQuotaLimitSummary,
  formatSubscriptionTotalValue,
} from '@/features/subscriptions/lib'
import type {
  PlanRecord,
  SubscriptionPlan,
} from '@/features/subscriptions/types'

type SubscriptionPlanCardProps = {
  record: PlanRecord
  isAuthenticated: boolean
  featured?: boolean
}

function splitGroups(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getTotalLabel(plan: SubscriptionPlan, t: TFunction) {
  const total = Number(plan.total_amount || 0)
  if (total <= 0) return t('Unlimited')
  return formatSubscriptionTotalValue(total, plan, t, formatQuota, {
    approximateTimes: plan.approximate_times,
  })
}

export function SubscriptionPlanCard({
  record,
  isAuthenticated,
  featured = false,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation()
  const plan = record.plan
  const allowedGroups = splitGroups(plan.allowed_groups)
  const limitSummary = formatSubscriptionQuotaLimitSummary(
    plan,
    t,
    formatQuota,
    { maxItems: 4, includeMode: false }
  )
  const resetPeriod = formatResetPeriod(plan, t)
  const purchaseLimit = Number(plan.max_purchase_per_user || 0)

  const highlights = [
    {
      icon: Clock,
      label: t('Validity Period'),
      value: formatDuration(plan, t),
    },
    {
      icon: Layers,
      label: t('Billing Mode'),
      value: formatBillingMode(plan.billing_mode, t),
    },
    {
      icon: ShieldCheck,
      label: t('Total Quota'),
      value: getTotalLabel(plan, t),
    },
  ]

  const details = [
    resetPeriod !== t('No Reset')
      ? `${t('Quota Reset')}: ${resetPeriod}`
      : null,
    limitSummary !== t('No Limits')
      ? `${t('Quota Limits')}: ${limitSummary}`
      : null,
    allowedGroups.length > 0
      ? `${t('Allowed Groups')}: ${allowedGroups.join(', ')}`
      : null,
    plan.upgrade_group ? `${t('Upgrade Group')}: ${plan.upgrade_group}` : null,
    purchaseLimit > 0 ? `${t('Purchase Limit')}: ${purchaseLimit}` : null,
  ].filter(Boolean) as string[]

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border-border/70 bg-background/95 shadow-sm transition-shadow hover:shadow-md',
        featured && 'border-primary/50 shadow-md'
      )}
    >
      <CardHeader className='space-y-4'>
        <div className='flex min-w-0 items-start justify-between gap-3'>
          <div className='min-w-0'>
            <CardTitle className='truncate text-xl'>{plan.title}</CardTitle>
            {plan.subtitle ? (
              <p className='mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground'>
                {plan.subtitle}
              </p>
            ) : null}
          </div>
          {featured ? (
            <StatusBadge variant='info' copyable={false}>
              {t('Recommended')}
            </StatusBadge>
          ) : null}
        </div>

        <div className='flex min-w-0 flex-wrap items-end gap-2'>
          <span className='break-words text-3xl font-bold tracking-tight text-primary'>
            {formatCurrencyUSD(Number(plan.price_amount || 0))}
          </span>
          <span className='pb-1 text-xs font-medium text-muted-foreground uppercase'>
            {plan.currency || 'USD'}
          </span>
        </div>
      </CardHeader>

      <CardContent className='flex-1 space-y-5'>
        <div className='grid gap-2.5'>
          {highlights.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className='flex items-start gap-3 rounded-md border bg-muted/20 p-3'
              >
                <Icon className='mt-0.5 size-4 shrink-0 text-primary' />
                <div className='min-w-0'>
                  <div className='text-xs text-muted-foreground'>
                    {item.label}
                  </div>
                  <div className='mt-0.5 break-words text-sm font-medium'>
                    {item.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {details.length > 0 ? (
          <div className='space-y-2'>
            {details.map((detail) => (
              <div key={detail} className='flex gap-2 text-sm leading-relaxed'>
                <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                <span className='break-words text-muted-foreground'>
                  {detail}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Badge variant='outline' className='w-fit'>
            {t('No Limits')}
          </Badge>
        )}
      </CardContent>

      <CardFooter>
        <Link
          to={isAuthenticated ? '/my-subscriptions' : '/sign-up'}
          className={cn(buttonVariants(), 'w-full min-w-0')}
        >
          <span className='min-w-0 truncate'>
            {isAuthenticated ? t('Subscribe Now') : t('Sign in to subscribe')}
          </span>
          <ArrowRight className='size-4 shrink-0' />
        </Link>
      </CardFooter>
    </Card>
  )
}
