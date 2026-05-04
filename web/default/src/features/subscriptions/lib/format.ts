import type { TFunction } from 'i18next'
import dayjs from '@/lib/dayjs'
import type { SubscriptionPlan } from '../types'

type SubscriptionBillingMode = 'quota' | 'request'
type SubscriptionBillingModeSource = {
  billing_mode?: string
  subscription?: {
    billing_mode?: string
  }
}

export type SubscriptionQuotaLimitKey =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'

export interface SubscriptionQuotaLimitItem extends SubscriptionBillingModeSource {
  key: SubscriptionQuotaLimitKey
  label: string
  amount: number
  used: number
  mode?: string
  nextResetTime: number
  approximateTimes: number
}

export interface SubscriptionAmountFormatOptions {
  approximateTimes?: number
}

export interface SubscriptionQuotaLimitSummaryOptions {
  maxItems?: number
  includeMode?: boolean
}

export function formatDuration(
  plan: Partial<SubscriptionPlan>,
  t: TFunction
): string {
  const unit = plan?.duration_unit || 'month'
  const value = plan?.duration_value || 1
  const unitLabels: Record<string, string> = {
    year: t('years'),
    month: t('months'),
    day: t('days'),
    hour: t('hours'),
    custom: t('Custom (seconds)'),
  }
  if (unit === 'custom') {
    const seconds = plan?.custom_seconds || 0
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} ${t('days')}`
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} ${t('hours')}`
    return `${seconds} ${t('seconds')}`
  }
  return `${value} ${unitLabels[unit] || unit}`
}

export function formatResetPeriod(
  plan: Partial<SubscriptionPlan>,
  t: TFunction
): string {
  const period = plan?.quota_reset_period || 'never'
  if (period === 'daily') return t('Daily')
  if (period === 'weekly') return t('Weekly')
  if (period === 'monthly') return t('Monthly')
  if (period === 'custom') {
    const seconds = Number(plan?.quota_reset_custom_seconds || 0)
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} ${t('days')}`
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} ${t('hours')}`
    if (seconds >= 60) return `${Math.floor(seconds / 60)} ${t('minutes')}`
    return `${seconds} ${t('seconds')}`
  }
  return t('No Reset')
}

export function formatTimestamp(ts: number): string {
  if (!ts) return '-'
  return dayjs(ts * 1000).format('YYYY-MM-DD HH:mm:ss')
}

export function formatBillingMode(
  mode: string | undefined,
  t: TFunction
): string {
  if (mode === 'request') return t('Request-based')
  return t('Quota-based')
}

export function formatResetMode(
  mode: string | undefined,
  t: TFunction
): string {
  if (mode === 'natural') return t('Natural Calendar')
  return t('Anchor')
}

export function normalizeSubscriptionBillingMode(
  mode: string | undefined
): SubscriptionBillingMode {
  return mode === 'request' ? 'request' : 'quota'
}

export function isRequestBasedSubscription(
  target: SubscriptionBillingModeSource | undefined
): boolean {
  const mode = target?.billing_mode || target?.subscription?.billing_mode
  return normalizeSubscriptionBillingMode(mode) === 'request'
}

function formatApproximateTimes(
  approximateTimes: number | undefined,
  t: TFunction
): string {
  const count = Number(approximateTimes || 0)
  if (!Number.isFinite(count) || count <= 0) return ''
  return ` (${t('Approx.')} ${count.toLocaleString()} ${t('times')})`
}

export function formatSubscriptionAmountValue(
  value: number | undefined,
  target: SubscriptionBillingModeSource | undefined,
  t: TFunction,
  renderQuota: (value: number) => string,
  options: SubscriptionAmountFormatOptions = {}
): string {
  const amount = Number(value || 0)
  if (isRequestBasedSubscription(target)) {
    return `${amount.toLocaleString()} ${t('times')}`
  }

  return `${renderQuota(amount)}${formatApproximateTimes(
    options.approximateTimes,
    t
  )}`
}

export function formatSubscriptionTotalValue(
  value: number | undefined,
  target: SubscriptionBillingModeSource | undefined,
  t: TFunction,
  renderQuota: (value: number) => string,
  options: SubscriptionAmountFormatOptions = {}
): string {
  return formatSubscriptionAmountValue(value, target, t, renderQuota, options)
}

function formatHourlyLimitLabel(hours: number, t: TFunction): string {
  return `${String(t('Every')).trim()} ${hours} ${t('hours')}`.trim()
}

export function getSubscriptionQuotaLimitItems(
  source: Partial<SubscriptionPlan> | undefined,
  t: TFunction
): SubscriptionQuotaLimitItem[] {
  if (!source) return []

  const billingMode = normalizeSubscriptionBillingMode(source.billing_mode)
  const hourlyAmount = Number(source.hourly_limit_amount || 0)
  const dailyAmount = Number(source.daily_limit_amount || 0)
  const weeklyAmount = Number(source.weekly_limit_amount || 0)
  const monthlyAmount = Number(source.monthly_limit_amount || 0)
  const items: SubscriptionQuotaLimitItem[] = []

  if (hourlyAmount > 0) {
    const hours = Number(source.hourly_limit_hours || 1)
    items.push({
      key: 'hourly',
      label: formatHourlyLimitLabel(hours, t),
      amount: hourlyAmount,
      used: 0,
      mode: source.hourly_reset_mode,
      nextResetTime: 0,
      billing_mode: billingMode,
      approximateTimes: Number(source.hourly_approximate_times || 0),
    })
  }

  if (dailyAmount > 0) {
    items.push({
      key: 'daily',
      label: t('Daily'),
      amount: dailyAmount,
      used: 0,
      mode: source.daily_reset_mode,
      nextResetTime: 0,
      billing_mode: billingMode,
      approximateTimes: Number(source.daily_approximate_times || 0),
    })
  }

  if (weeklyAmount > 0) {
    items.push({
      key: 'weekly',
      label: t('Weekly'),
      amount: weeklyAmount,
      used: 0,
      mode: source.weekly_reset_mode,
      nextResetTime: 0,
      billing_mode: billingMode,
      approximateTimes: Number(source.weekly_approximate_times || 0),
    })
  }

  if (monthlyAmount > 0) {
    items.push({
      key: 'monthly',
      label: t('Monthly'),
      amount: monthlyAmount,
      used: 0,
      mode: source.monthly_reset_mode,
      nextResetTime: 0,
      billing_mode: billingMode,
      approximateTimes: Number(source.monthly_approximate_times || 0),
    })
  }

  return items
}

export function formatSubscriptionQuotaLimitItemText(
  item: SubscriptionQuotaLimitItem,
  t: TFunction,
  renderQuota: (value: number) => string,
  options: Pick<SubscriptionQuotaLimitSummaryOptions, 'includeMode'> = {}
): string {
  let text = `${item.label}: ${formatSubscriptionAmountValue(
    item.amount,
    item,
    t,
    renderQuota,
    {
      approximateTimes: item.approximateTimes,
    }
  )}`

  if (options.includeMode) {
    text += ` · ${formatResetMode(item.mode, t)}`
  }

  return text
}

export function formatSubscriptionQuotaLimitSummary(
  source: Partial<SubscriptionPlan> | undefined,
  t: TFunction,
  renderQuota: (value: number) => string,
  options: SubscriptionQuotaLimitSummaryOptions = {}
): string {
  const items = getSubscriptionQuotaLimitItems(source, t)
  if (items.length === 0) return t('No Limits')

  const maxItems = Math.max(1, Number(options.maxItems || items.length))
  const visibleItems = items.slice(0, maxItems)
  const segments = visibleItems.map((item) =>
    formatSubscriptionQuotaLimitItemText(item, t, renderQuota, {
      includeMode: options.includeMode,
    })
  )

  if (items.length > visibleItems.length) {
    segments.push(`+${items.length - visibleItems.length}`)
  }

  return segments.join(' / ')
}
