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
import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type {
  AdminPlan,
  AdminPlanPayload,
  AdminSearchUser,
  AdminSubscription,
  AdminSubscriptionsResponse,
  GrantSubscriptionRequest,
  UpdateResetLimitRequest,
} from './types'

type BackendPlan = {
  id: number
  title?: string
  subtitle?: string
  price_amount?: number
  currency?: string
  duration_unit?: string
  duration_value?: number
  custom_seconds?: number
  total_amount?: number
  enabled?: boolean
  show_on_home?: boolean
  sort_order?: number
  allowed_groups?: string
  daily_limit_amount?: number
  weekly_limit_amount?: number
  monthly_limit_amount?: number
}

const BACKEND_DURATION_UNITS = new Set([
  'year',
  'month',
  'day',
  'hour',
  'custom',
])

function normalizeDurationUnit(unit?: string): string {
  return unit && BACKEND_DURATION_UNITS.has(unit) ? unit : 'month'
}

type BackendPlanRecord = {
  plan?: BackendPlan
}

type BackendSubscriptionsResponse = {
  data?: BackendSubscriptionOverview[]
  items?: BackendSubscriptionOverview[]
  total?: number
  page?: number
  page_size?: number
}

type BackendSubscriptionOverview = {
  id: number
  user_id: number
  username?: string
  user_display_name?: string
  user_email?: string
  plan_id?: number
  plan_title?: string
  status: string
  billing_mode?: string
  amount_total?: number
  amount_used?: number
  amount_remaining?: number
  start_time: number
  end_time: number
  daily_limit_amount?: number
  weekly_limit_amount?: number
  monthly_limit_amount?: number
  allowed_groups?: string
}

type UserSearchResponse = {
  items?: AdminSearchUser[]
  total?: number
  page?: number
  page_size?: number
}

function isBackendPlanRecord(
  record: BackendPlanRecord | BackendPlan
): record is BackendPlanRecord {
  return Object.prototype.hasOwnProperty.call(record, 'plan')
}

function mapPlanRecord(record: BackendPlanRecord | BackendPlan): AdminPlan {
  const plan = isBackendPlanRecord(record)
    ? record.plan || ({} as BackendPlan)
    : record
  return {
    id: plan.id,
    name: plan.title || `#${plan.id}`,
    type: plan.subtitle || `#${plan.id}`,
    description: plan.subtitle || '',
    price: plan.price_amount ?? 0,
    currency: plan.currency || 'USD',
    total_quota: plan.total_amount ?? 0,
    is_unlimited_time: false,
    duration_value: plan.duration_value ?? 1,
    duration_unit: normalizeDurationUnit(plan.duration_unit),
    custom_seconds: plan.custom_seconds ?? 0,
    daily_quota_per_plan: plan.daily_limit_amount ?? 0,
    weekly_quota_per_plan: plan.weekly_limit_amount ?? 0,
    monthly_quota_per_plan: plan.monthly_limit_amount ?? 0,
    reset_quota_limit: 0,
    deduction_group: plan.allowed_groups || '',
    is_active: plan.enabled ?? true,
    show_in_portal: plan.show_on_home ?? false,
    sort_order: plan.sort_order ?? 0,
  }
}

function toBackendPlanPayload(data: AdminPlanPayload): BackendPlan {
  return {
    id: data.id || 0,
    title: data.name || data.type || '',
    subtitle: data.type || data.description || '',
    price_amount: data.price ?? 0,
    currency: data.currency || 'USD',
    duration_unit: normalizeDurationUnit(data.duration_unit),
    duration_value: data.duration_unit === 'custom' ? 0 : data.duration_value || 1,
    custom_seconds:
      data.duration_unit === 'custom' ? data.custom_seconds || 3600 : 0,
    total_amount: data.total_quota ?? 0,
    enabled: data.is_active ?? true,
    show_on_home: data.show_in_portal ?? false,
    sort_order: data.sort_order ?? 0,
    allowed_groups: data.deduction_group || '',
    daily_limit_amount: data.daily_quota_per_plan ?? 0,
    weekly_limit_amount: data.weekly_quota_per_plan ?? 0,
    monthly_limit_amount: data.monthly_quota_per_plan ?? 0,
  }
}

function mapSubscriptionOverview(
  item: BackendSubscriptionOverview
): AdminSubscription {
  const amountTotal = item.amount_total ?? 0
  const amountUsed = item.amount_used ?? 0
  const amountRemaining =
    item.amount_remaining ?? Math.max(amountTotal - amountUsed, 0)
  return {
    id: item.id,
    user_id: item.user_id,
    user: {
      id: item.user_id,
      username: item.username,
      email: item.user_email,
      display_name: item.user_display_name,
    },
    plan_type: item.plan_id ? String(item.plan_id) : undefined,
    package_plan: {
      type: item.plan_id ? String(item.plan_id) : undefined,
      name: item.plan_title,
      description: item.billing_mode,
    },
    status: item.status,
    total_quota: amountTotal,
    remain_quota: amountRemaining,
    used_quota: amountUsed,
    reset_quota_limit: 0,
    start_time: item.start_time,
    end_time: item.end_time,
  }
}

// ============================================================================
// Subscriptions
// ============================================================================

export async function getAdminSubscriptions(
  params: { page?: number; page_size?: number; status?: string } = {}
): Promise<ApiResponse<AdminSubscriptionsResponse>> {
  const { page = 1, page_size = 10, status } = params
  const searchParams = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  })
  if (status) searchParams.set('status', status)

  const res = await api.get<ApiResponse<BackendSubscriptionsResponse>>(
    `/api/subscription/admin/all?${searchParams.toString()}`
  )
  const payload = res.data
  const data = payload.data
  const rows = data?.data || data?.items || []
  return {
    ...payload,
    data: {
      subscriptions: rows.map(mapSubscriptionOverview),
      total: data?.total ?? rows.length,
    },
  }
}

export async function deleteSubscription(
  id: number
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.delete(`/api/subscription/admin/user_subscriptions/${id}`)
  return res.data
}

export async function cancelSubscription(
  id: number
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.post(
    `/api/subscription/admin/user_subscriptions/${id}/invalidate`
  )
  return res.data
}

export async function updateResetLimit(
  id: number,
  data: UpdateResetLimitRequest
): Promise<ApiResponse<{ message?: string }>> {
  void id
  void data
  return {
    success: false,
    message: 'Reset limit updates are not supported by the subscription backend.',
  }
}

export async function grantSubscription(
  data: GrantSubscriptionRequest
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.post('/api/subscription/admin/bind', {
    user_id: data.user_id,
    plan_id: data.plan_id,
  })
  return res.data
}

// ============================================================================
// Plans
// ============================================================================

export async function getAdminPlans(): Promise<ApiResponse<AdminPlan[]>> {
  const res = await api.get<ApiResponse<BackendPlanRecord[]>>(
    '/api/subscription/admin/plans'
  )
  return {
    ...res.data,
    data: (res.data.data || []).map(mapPlanRecord),
  }
}

export async function createPlan(
  data: AdminPlanPayload
): Promise<ApiResponse<AdminPlan>> {
  const res = await api.post<ApiResponse<BackendPlan>>(
    '/api/subscription/admin/plans',
    { plan: toBackendPlanPayload(data) }
  )
  return {
    ...res.data,
    data: res.data.data ? mapPlanRecord(res.data.data) : undefined,
  }
}

export async function updatePlan(
  id: number,
  data: AdminPlanPayload
): Promise<ApiResponse<AdminPlan>> {
  const res = await api.put<ApiResponse<BackendPlan>>(
    `/api/subscription/admin/plans/${id}`,
    { plan: { ...toBackendPlanPayload(data), id } }
  )
  return {
    ...res.data,
    data: res.data.data ? mapPlanRecord(res.data.data) : undefined,
  }
}

export async function deletePlan(
  id: number
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.delete(`/api/subscription/admin/plans/${id}`)
  return res.data
}

// ============================================================================
// User search + groups
// ============================================================================

export async function searchUsers(
  keyword: string
): Promise<ApiResponse<AdminSearchUser[] | { users?: AdminSearchUser[] }>> {
  const res = await api.get<ApiResponse<UserSearchResponse>>(
    `/api/user/search?keyword=${encodeURIComponent(keyword)}&p=1&page_size=10`
  )
  return {
    ...res.data,
    data: res.data.data?.items || [],
  }
}

export async function getUserGroups(): Promise<
  ApiResponse<Record<string, { desc?: string; ratio?: number }>>
> {
  const res = await api.get('/api/user/self/groups')
  return res.data
}

export type { AdminPlan, AdminSubscription }
