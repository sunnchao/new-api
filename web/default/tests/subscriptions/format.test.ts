import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  formatSubscriptionAmountValue,
  formatSubscriptionQuotaLimitSummary,
  formatSubscriptionTotalValue,
  getSubscriptionQuotaLimitItems,
  isRequestBasedSubscription,
} from '../../src/features/subscriptions/lib/format'
import type { SubscriptionPlan } from '../../src/features/subscriptions/types'

const t = ((key: string, options?: { count?: number }) => {
  if (key === 'More items') return `+${options?.count ?? 0}`
  return key
}) as never

const renderQuota = (value: number) => `quota:${value}`
const planQuotaCellsPath = join(
  import.meta.dir,
  '../../src/features/subscriptions/components/plan-quota-cells.tsx'
)

test('formats request-based subscription amounts as request counts', () => {
  const plan = {
    billing_mode: 'request',
    total_amount: 1500,
  } as SubscriptionPlan

  expect(isRequestBasedSubscription(plan)).toBe(true)
  expect(formatSubscriptionTotalValue(plan.total_amount, plan, t, renderQuota)).toBe(
    '1,500 times'
  )
})

test('formats quota-based subscription amounts with approximate request counts', () => {
  const plan = {
    billing_mode: 'quota',
    total_amount: 500000,
    approximate_times: 120,
  } as SubscriptionPlan

  expect(isRequestBasedSubscription(plan)).toBe(false)
  expect(
    formatSubscriptionTotalValue(plan.total_amount, plan, t, renderQuota, {
      approximateTimes: plan.approximate_times,
    })
  ).toBe('quota:500000 (Approx. 120 times)')
})

test('builds full quota limit summaries from active plan limit windows', () => {
  const plan = {
    billing_mode: 'quota',
    hourly_limit_amount: 1000,
    hourly_limit_hours: 2,
    hourly_reset_mode: 'anchor',
    hourly_approximate_times: 10,
    daily_limit_amount: 5000,
    daily_reset_mode: 'natural',
    daily_approximate_times: 50,
    weekly_limit_amount: 0,
    monthly_limit_amount: 12000,
    monthly_reset_mode: 'anchor',
    monthly_approximate_times: 120,
  } as SubscriptionPlan

  const items = getSubscriptionQuotaLimitItems(plan, t)

  expect(items.map((item) => item.key)).toEqual(['hourly', 'daily', 'monthly'])
  expect(
    formatSubscriptionQuotaLimitSummary(plan, t, renderQuota)
  ).toBe(
    'Every 2 hours: quota:1000 (Approx. 10 times) / Daily: quota:5000 (Approx. 50 times) / Monthly: quota:12000 (Approx. 120 times)'
  )
})

test('builds quota limit items from user subscription usage snapshots', () => {
  const subscription = {
    billing_mode: 'quota',
    hourly_limit_amount: 1000,
    hourly_limit_hours: 2,
    hourly_reset_mode: 'anchor',
    hourly_amount_used: 250,
    hourly_next_reset_time: 1710000000,
    daily_limit_amount: 5000,
    daily_reset_mode: 'natural',
    daily_amount_used: 1250,
    daily_next_reset_time: 1710050000,
  } as SubscriptionPlan

  const items = getSubscriptionQuotaLimitItems(subscription, t)

  expect(items).toMatchObject([
    {
      key: 'hourly',
      label: 'Every 2 hours',
      amount: 1000,
      used: 250,
      mode: 'anchor',
      nextResetTime: 1710000000,
    },
    {
      key: 'daily',
      label: 'Daily',
      amount: 5000,
      used: 1250,
      mode: 'natural',
      nextResetTime: 1710050000,
    },
  ])
})

test('omits approximate text for request-based quota limits', () => {
  const plan = {
    billing_mode: 'request',
    daily_limit_amount: 300,
    daily_approximate_times: 50,
  } as SubscriptionPlan

  expect(
    formatSubscriptionAmountValue(plan.daily_limit_amount, plan, t, renderQuota, {
      approximateTimes: plan.daily_approximate_times,
    })
  ).toBe('300 times')
  expect(formatSubscriptionQuotaLimitSummary(plan, t, renderQuota)).toBe(
    'Daily: 300 times'
  )
})

test('plans quota limits cell renders every configured limit without collapsed count', () => {
  const source = readFileSync(planQuotaCellsPath, 'utf8')

  expect(source).not.toContain('slice(0, 2)')
  expect(source).not.toContain('hiddenCount')
})
