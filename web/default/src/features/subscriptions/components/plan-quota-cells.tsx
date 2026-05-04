import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrencyUSD, formatQuota } from '@/lib/format'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { StatusBadge, type StatusVariant } from '@/components/status-badge'
import {
  formatSubscriptionQuotaLimitItemText,
  formatSubscriptionTotalValue,
  getSubscriptionQuotaLimitItems,
  isRequestBasedSubscription,
} from '../lib'
import type { SubscriptionPlan } from '../types'

interface PlanQuotaCellProps {
  plan: SubscriptionPlan
}

const limitVariantMap: Record<string, StatusVariant> = {
  hourly: 'orange',
  daily: 'blue',
  weekly: 'green',
  monthly: 'purple',
}

export function PlanPriceCell(props: PlanQuotaCellProps) {
  return (
    <span className='font-semibold text-emerald-600'>
      {formatCurrencyUSD(Number(props.plan.price_amount || 0))}
    </span>
  )
}

export function PlanTotalQuotaCell(props: PlanQuotaCellProps) {
  const { t } = useTranslation()
  const total = Number(props.plan.total_amount || 0)

  if (total <= 0) {
    return (
      <StatusBadge label={t('Unlimited')} variant='neutral' copyable={false} />
    )
  }

  const value = formatSubscriptionTotalValue(
    total,
    props.plan,
    t,
    formatQuota,
    {
      approximateTimes: props.plan.approximate_times,
    }
  )

  if (isRequestBasedSubscription(props.plan)) {
    return <span className='text-xs font-medium'>{value}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='cursor-help text-xs font-medium'>{value}</span>
      </TooltipTrigger>
      <TooltipContent>
        {t('Raw Quota')}: {total.toLocaleString()}
      </TooltipContent>
    </Tooltip>
  )
}

export function PlanQuotaLimitsCell(props: PlanQuotaCellProps) {
  const { t } = useTranslation()
  const items = useMemo(
    () => getSubscriptionQuotaLimitItems(props.plan, t),
    [props.plan, t]
  )

  if (items.length === 0) {
    return (
      <span className='text-muted-foreground text-xs'>{t('No Limits')}</span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className='flex max-w-[240px] flex-wrap gap-x-2 gap-y-1'>
          {items.map((item) => (
            <StatusBadge
              key={item.key}
              variant={limitVariantMap[item.key] || 'neutral'}
              copyable={false}
              className='max-w-full'
            >
              <span className='max-w-[210px] truncate'>
                {formatSubscriptionQuotaLimitItemText(item, t, formatQuota)}
              </span>
            </StatusBadge>
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent className='max-w-[320px] space-y-1'>
        {items.map((item) => (
          <div key={item.key}>
            {formatSubscriptionQuotaLimitItemText(item, t, formatQuota, {
              includeMode: true,
            })}
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}
