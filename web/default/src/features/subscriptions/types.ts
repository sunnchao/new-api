import { z } from 'zod'

// ============================================================================
// Subscription Plan Schema & Types
// ============================================================================

export const subscriptionPlanSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string().optional(),
  price_amount: z.number(),
  currency: z.string().default('USD'),
  duration_unit: z.enum(['year', 'month', 'day', 'hour', 'custom']),
  duration_value: z.number(),
  custom_seconds: z.number().optional(),
  quota_reset_period: z.enum(['never', 'daily', 'weekly', 'monthly', 'custom']),
  quota_reset_mode: z.enum(['anchor', 'natural']).optional(),
  quota_reset_custom_seconds: z.number().optional(),
  enabled: z.boolean(),
  show_on_home: z.boolean().optional(),
  sort_order: z.number(),
  max_purchase_per_user: z.number(),
  total_amount: z.number(),
  upgrade_group: z.string().optional(),
  allowed_groups: z.string().optional(),
  billing_mode: z.enum(['quota', 'request']).optional(),
  stripe_price_id: z.string().optional(),
  creem_product_id: z.string().optional(),
  // Rate limits
  hourly_limit_amount: z.number().optional(),
  hourly_limit_hours: z.number().optional(),
  hourly_reset_mode: z.enum(['anchor', 'natural']).optional(),
  daily_limit_amount: z.number().optional(),
  daily_reset_mode: z.enum(['anchor', 'natural']).optional(),
  weekly_limit_amount: z.number().optional(),
  weekly_reset_mode: z.enum(['anchor', 'natural']).optional(),
  monthly_limit_amount: z.number().optional(),
  monthly_reset_mode: z.enum(['anchor', 'natural']).optional(),
  // Approximate times
  approximate_times: z.number().optional(),
  hourly_approximate_times: z.number().optional(),
  daily_approximate_times: z.number().optional(),
  weekly_approximate_times: z.number().optional(),
  monthly_approximate_times: z.number().optional(),
})

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>

export interface PlanRecord {
  plan: SubscriptionPlan
}

// ============================================================================
// User Subscription Schema & Types
// ============================================================================

export const userSubscriptionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  plan_id: z.number(),
  status: z.string(),
  source: z.string().optional(),
  billing_mode: z.string().optional(),
  start_time: z.number(),
  end_time: z.number(),
  amount_total: z.number(),
  amount_used: z.number(),
  last_reset_time: z.number().optional(),
  next_reset_time: z.number().optional(),
  upgrade_group: z.string().optional(),
  allowed_groups: z.string().optional(),
  approximate_times: z.number().optional(),
  // Hourly rate limit
  hourly_limit_amount: z.number().optional(),
  hourly_limit_hours: z.number().optional(),
  hourly_reset_mode: z.string().optional(),
  hourly_amount_used: z.number().optional(),
  hourly_next_reset_time: z.number().optional(),
  hourly_approximate_times: z.number().optional(),
  // Daily rate limit
  daily_limit_amount: z.number().optional(),
  daily_reset_mode: z.string().optional(),
  daily_amount_used: z.number().optional(),
  daily_next_reset_time: z.number().optional(),
  daily_approximate_times: z.number().optional(),
  // Weekly rate limit
  weekly_limit_amount: z.number().optional(),
  weekly_reset_mode: z.string().optional(),
  weekly_amount_used: z.number().optional(),
  weekly_next_reset_time: z.number().optional(),
  weekly_approximate_times: z.number().optional(),
  // Monthly rate limit
  monthly_limit_amount: z.number().optional(),
  monthly_reset_mode: z.string().optional(),
  monthly_amount_used: z.number().optional(),
  monthly_next_reset_time: z.number().optional(),
  monthly_approximate_times: z.number().optional(),
})

export type UserSubscription = z.infer<typeof userSubscriptionSchema>

export interface UserSubscriptionRecord {
  subscription: UserSubscription
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface PlanPayload {
  plan: Partial<SubscriptionPlan>
}

export interface SubscriptionPayRequest {
  plan_id: number
  payment_method?: string
}

export interface SubscriptionPayResponse {
  success: boolean
  message?: string
  data?: {
    pay_link?: string
    checkout_url?: string
  }
  url?: string
}

export interface CreateUserSubscriptionRequest {
  plan_id: number
}

// ============================================================================
// Self Subscription Data (user-facing)
// ============================================================================

export interface SelfSubscriptionData {
  billing_preference: string
  subscriptions: UserSubscriptionRecord[]
  all_subscriptions: UserSubscriptionRecord[]
}

// ============================================================================
// Admin All User Subscriptions Overview
// ============================================================================

export interface AdminUserSubscriptionOverview {
  id: number
  user_id: number
  username: string
  user_display_name: string
  user_email: string
  user_group: string
  plan_id: number
  plan_title: string
  status: string
  billing_mode: string
  start_time: number
  end_time: number
  amount_total: number
  amount_used: number
  amount_remaining: number
  approximate_times: number
  approximate_times_used: number
  upgrade_group: string
  allowed_groups: string
  // Rate limits
  hourly_limit_amount: number
  hourly_amount_used: number
  hourly_limit_hours: number
  hourly_reset_mode: string
  hourly_next_reset_time: number
  daily_limit_amount: number
  daily_amount_used: number
  daily_reset_mode: string
  daily_next_reset_time: number
  weekly_limit_amount: number
  weekly_amount_used: number
  weekly_reset_mode: string
  weekly_next_reset_time: number
  monthly_limit_amount: number
  monthly_amount_used: number
  monthly_reset_mode: string
  monthly_next_reset_time: number
}

export interface AdminAllSubscriptionsResponse {
  data: AdminUserSubscriptionOverview[]
  total: number
  page: number
  page_size: number
}

export interface AdminAllSubscriptionsParams {
  page?: number
  page_size?: number
  username?: string
  plan_id?: number
  status?: string
  user_group?: string
}

// ============================================================================
// Dialog Types
// ============================================================================

export type SubscriptionsDialogType = 'create' | 'update' | 'toggle-status'
