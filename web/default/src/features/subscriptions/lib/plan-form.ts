import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { SubscriptionPlan, PlanPayload } from '../types'

export function getPlanFormSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t('Please enter plan title')),
    subtitle: z.string().optional(),
    price_amount: z.coerce.number().min(0, t('Please enter amount')),
    duration_unit: z.enum(['year', 'month', 'day', 'hour', 'custom']),
    duration_value: z.coerce.number().min(1),
    custom_seconds: z.coerce.number().min(0).optional(),
    quota_reset_period: z.enum([
      'never',
      'daily',
      'weekly',
      'monthly',
      'custom',
    ]),
    quota_reset_mode: z.enum(['anchor', 'natural']).optional(),
    quota_reset_custom_seconds: z.coerce.number().min(0).optional(),
    enabled: z.boolean(),
    show_on_home: z.boolean().optional(),
    sort_order: z.coerce.number(),
    max_purchase_per_user: z.coerce.number().min(0),
    total_amount: z.coerce.number().min(0),
    upgrade_group: z.string().optional(),
    allowed_groups: z.string().optional(),
    billing_mode: z.enum(['quota', 'request']).optional(),
    stripe_price_id: z.string().optional(),
    creem_product_id: z.string().optional(),
    // Rate limits
    hourly_limit_amount: z.coerce.number().min(0).optional(),
    hourly_limit_hours: z.coerce.number().min(1).max(24).optional(),
    hourly_reset_mode: z.enum(['anchor', 'natural']).optional(),
    daily_limit_amount: z.coerce.number().min(0).optional(),
    daily_reset_mode: z.enum(['anchor', 'natural']).optional(),
    weekly_limit_amount: z.coerce.number().min(0).optional(),
    weekly_reset_mode: z.enum(['anchor', 'natural']).optional(),
    monthly_limit_amount: z.coerce.number().min(0).optional(),
    monthly_reset_mode: z.enum(['anchor', 'natural']).optional(),
    // Approximate times
    approximate_times: z.coerce.number().min(0).optional(),
    hourly_approximate_times: z.coerce.number().min(0).optional(),
    daily_approximate_times: z.coerce.number().min(0).optional(),
    weekly_approximate_times: z.coerce.number().min(0).optional(),
    monthly_approximate_times: z.coerce.number().min(0).optional(),
  })
}

export type PlanFormValues = z.infer<ReturnType<typeof getPlanFormSchema>>

export const PLAN_FORM_DEFAULTS: PlanFormValues = {
  title: '',
  subtitle: '',
  price_amount: 0,
  duration_unit: 'month',
  duration_value: 1,
  custom_seconds: 0,
  quota_reset_period: 'never',
  quota_reset_mode: 'anchor',
  quota_reset_custom_seconds: 0,
  enabled: true,
  show_on_home: false,
  sort_order: 0,
  max_purchase_per_user: 0,
  total_amount: 0,
  upgrade_group: '',
  allowed_groups: '',
  billing_mode: 'quota',
  stripe_price_id: '',
  creem_product_id: '',
  // Rate limits
  hourly_limit_amount: 0,
  hourly_limit_hours: 1,
  hourly_reset_mode: 'anchor',
  daily_limit_amount: 0,
  daily_reset_mode: 'anchor',
  weekly_limit_amount: 0,
  weekly_reset_mode: 'anchor',
  monthly_limit_amount: 0,
  monthly_reset_mode: 'anchor',
  // Approximate times
  approximate_times: 0,
  hourly_approximate_times: 0,
  daily_approximate_times: 0,
  weekly_approximate_times: 0,
  monthly_approximate_times: 0,
}

export function planToFormValues(plan: SubscriptionPlan): PlanFormValues {
  return {
    title: plan.title || '',
    subtitle: plan.subtitle || '',
    price_amount: Number(plan.price_amount || 0),
    duration_unit: plan.duration_unit || 'month',
    duration_value: Number(plan.duration_value || 1),
    custom_seconds: Number(plan.custom_seconds || 0),
    quota_reset_period: plan.quota_reset_period || 'never',
    quota_reset_mode: (plan.quota_reset_mode as 'anchor' | 'natural') || 'anchor',
    quota_reset_custom_seconds: Number(plan.quota_reset_custom_seconds || 0),
    enabled: plan.enabled !== false,
    show_on_home: plan.show_on_home || false,
    sort_order: Number(plan.sort_order || 0),
    max_purchase_per_user: Number(plan.max_purchase_per_user || 0),
    total_amount: Number(plan.total_amount || 0),
    upgrade_group: plan.upgrade_group || '',
    allowed_groups: plan.allowed_groups || '',
    billing_mode: (plan.billing_mode as 'quota' | 'request') || 'quota',
    stripe_price_id: plan.stripe_price_id || '',
    creem_product_id: plan.creem_product_id || '',
    // Rate limits
    hourly_limit_amount: Number(plan.hourly_limit_amount || 0),
    hourly_limit_hours: Number(plan.hourly_limit_hours || 1),
    hourly_reset_mode: (plan.hourly_reset_mode as 'anchor' | 'natural') || 'anchor',
    daily_limit_amount: Number(plan.daily_limit_amount || 0),
    daily_reset_mode: (plan.daily_reset_mode as 'anchor' | 'natural') || 'anchor',
    weekly_limit_amount: Number(plan.weekly_limit_amount || 0),
    weekly_reset_mode: (plan.weekly_reset_mode as 'anchor' | 'natural') || 'anchor',
    monthly_limit_amount: Number(plan.monthly_limit_amount || 0),
    monthly_reset_mode: (plan.monthly_reset_mode as 'anchor' | 'natural') || 'anchor',
    // Approximate times
    approximate_times: Number(plan.approximate_times || 0),
    hourly_approximate_times: Number(plan.hourly_approximate_times || 0),
    daily_approximate_times: Number(plan.daily_approximate_times || 0),
    weekly_approximate_times: Number(plan.weekly_approximate_times || 0),
    monthly_approximate_times: Number(plan.monthly_approximate_times || 0),
  }
}

export function formValuesToPlanPayload(values: PlanFormValues): PlanPayload {
  return {
    plan: {
      ...values,
      price_amount: Number(values.price_amount || 0),
      currency: 'USD',
      duration_value: Number(values.duration_value || 0),
      custom_seconds: Number(values.custom_seconds || 0),
      quota_reset_period: values.quota_reset_period || 'never',
      quota_reset_mode: values.quota_reset_mode || 'anchor',
      quota_reset_custom_seconds:
        values.quota_reset_period === 'custom'
          ? Number(values.quota_reset_custom_seconds || 0)
          : 0,
      sort_order: Number(values.sort_order || 0),
      max_purchase_per_user: Number(values.max_purchase_per_user || 0),
      total_amount: Number(values.total_amount || 0),
      upgrade_group: values.upgrade_group || '',
      allowed_groups: values.allowed_groups || '',
      billing_mode: values.billing_mode || 'quota',
      show_on_home: values.show_on_home || false,
      // Rate limits
      hourly_limit_amount: Number(values.hourly_limit_amount || 0),
      hourly_limit_hours: Number(values.hourly_limit_hours || 1),
      hourly_reset_mode: values.hourly_reset_mode || 'anchor',
      daily_limit_amount: Number(values.daily_limit_amount || 0),
      daily_reset_mode: values.daily_reset_mode || 'anchor',
      weekly_limit_amount: Number(values.weekly_limit_amount || 0),
      weekly_reset_mode: values.weekly_reset_mode || 'anchor',
      monthly_limit_amount: Number(values.monthly_limit_amount || 0),
      monthly_reset_mode: values.monthly_reset_mode || 'anchor',
      // Approximate times
      approximate_times: Number(values.approximate_times || 0),
      hourly_approximate_times: Number(values.hourly_approximate_times || 0),
      daily_approximate_times: Number(values.daily_approximate_times || 0),
      weekly_approximate_times: Number(values.weekly_approximate_times || 0),
      monthly_approximate_times: Number(values.monthly_approximate_times || 0),
    },
  }
}
