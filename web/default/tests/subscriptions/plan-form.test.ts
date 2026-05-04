import { afterEach, beforeEach, expect, test } from 'bun:test'
import type { SubscriptionPlan } from '../../src/features/subscriptions/types'

const storageValues = new Map<string, string>()
const memoryStorage: Storage = {
  get length() {
    return storageValues.size
  },
  clear() {
    storageValues.clear()
  },
  getItem(key: string) {
    return storageValues.get(key) ?? null
  },
  key(index: number) {
    return [...storageValues.keys()][index] ?? null
  },
  removeItem(key: string) {
    storageValues.delete(key)
  },
  setItem(key: string, value: string) {
    storageValues.set(key, value)
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
})
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: memoryStorage },
  configurable: true,
})

const { DEFAULT_CURRENCY_CONFIG, useSystemConfigStore } = await import(
  '../../src/stores/system-config-store'
)
const { formValuesToPlanPayload, PLAN_FORM_DEFAULTS, planToFormValues } =
  await import('../../src/features/subscriptions/lib/plan-form')

beforeEach(() => {
  useSystemConfigStore.getState().setConfig({
    currency: {
      ...DEFAULT_CURRENCY_CONFIG,
      quotaDisplayType: 'CNY',
      quotaPerUnit: 500000,
      usdExchangeRate: 7,
    },
  })
})

afterEach(() => {
  useSystemConfigStore.getState().setConfig({
    currency: { ...DEFAULT_CURRENCY_CONFIG },
  })
})

test('converts quota-based total amount to display currency when editing', () => {
  const plan = {
    total_amount: 1000000,
    billing_mode: 'quota',
  } as SubscriptionPlan

  expect(planToFormValues(plan).total_amount).toBe(14)
})

test('converts quota-based total amount back to raw quota for submission', () => {
  const payload = formValuesToPlanPayload({
    ...PLAN_FORM_DEFAULTS,
    billing_mode: 'quota',
    total_amount: 14,
  })

  expect(payload.plan.total_amount).toBe(1000000)
})

test('keeps request-based total amount as request count', () => {
  const plan = {
    total_amount: 1500,
    billing_mode: 'request',
  } as SubscriptionPlan

  expect(planToFormValues(plan).total_amount).toBe(1500)

  const payload = formValuesToPlanPayload({
    ...PLAN_FORM_DEFAULTS,
    billing_mode: 'request',
    total_amount: 1500,
  })

  expect(payload.plan.total_amount).toBe(1500)
})

test('converts quota-based limit amounts to display currency when editing', () => {
  const plan = {
    billing_mode: 'quota',
    hourly_limit_amount: 500000,
    daily_limit_amount: 1000000,
    weekly_limit_amount: 1500000,
    monthly_limit_amount: 2000000,
  } as SubscriptionPlan

  const values = planToFormValues(plan)

  expect(values.hourly_limit_amount).toBe(7)
  expect(values.daily_limit_amount).toBe(14)
  expect(values.weekly_limit_amount).toBe(21)
  expect(values.monthly_limit_amount).toBe(28)
})

test('converts quota-based limit amounts back to raw quota for submission', () => {
  const payload = formValuesToPlanPayload({
    ...PLAN_FORM_DEFAULTS,
    billing_mode: 'quota',
    hourly_limit_amount: 7,
    daily_limit_amount: 14,
    weekly_limit_amount: 21,
    monthly_limit_amount: 28,
  })

  expect(payload.plan.hourly_limit_amount).toBe(500000)
  expect(payload.plan.daily_limit_amount).toBe(1000000)
  expect(payload.plan.weekly_limit_amount).toBe(1500000)
  expect(payload.plan.monthly_limit_amount).toBe(2000000)
})

test('keeps request-based limit amounts as request counts', () => {
  const plan = {
    billing_mode: 'request',
    hourly_limit_amount: 10,
    daily_limit_amount: 20,
    weekly_limit_amount: 30,
    monthly_limit_amount: 40,
  } as SubscriptionPlan

  const values = planToFormValues(plan)

  expect(values.hourly_limit_amount).toBe(10)
  expect(values.daily_limit_amount).toBe(20)
  expect(values.weekly_limit_amount).toBe(30)
  expect(values.monthly_limit_amount).toBe(40)

  const payload = formValuesToPlanPayload({
    ...PLAN_FORM_DEFAULTS,
    billing_mode: 'request',
    hourly_limit_amount: 10,
    daily_limit_amount: 20,
    weekly_limit_amount: 30,
    monthly_limit_amount: 40,
  })

  expect(payload.plan.hourly_limit_amount).toBe(10)
  expect(payload.plan.daily_limit_amount).toBe(20)
  expect(payload.plan.weekly_limit_amount).toBe(30)
  expect(payload.plan.monthly_limit_amount).toBe(40)
})
