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

// ============================================================================
// Admin Package Plan
// ============================================================================

export interface AdminPlan {
  id: number
  hash_id?: string
  name: string
  type: string
  service_type?: string
  description?: string
  price: number
  currency: string
  total_quota: number
  max_client_count?: number
  is_unlimited_time?: boolean
  duration_value?: number
  duration_unit?: string
  custom_seconds?: number
  daily_quota_per_plan?: number
  weekly_quota_per_plan?: number
  monthly_quota_per_plan?: number
  reset_quota_limit?: number
  deduction_group?: string
  is_active?: boolean
  show_in_portal?: boolean
  sort_order?: number
}

export type AdminPlanPayload = Partial<Omit<AdminPlan, 'deduction_group'>> & {
  deduction_group?: string
}

// ============================================================================
// Admin User Subscription
// ============================================================================

export interface AdminSubscriptionUser {
  id?: number
  username?: string
  email?: string
  display_name?: string
}

export interface AdminSubscription {
  id: number
  hash_id?: string
  user_id: number
  user?: AdminSubscriptionUser
  plan_type?: string
  package_plan?: {
    type?: string
    name?: string
    description?: string
  }
  status: string
  service_type?: string
  total_quota: number
  remain_quota: number
  used_quota?: number
  reset_quota_limit?: number
  start_time: number
  end_time: number
}

export interface AdminSubscriptionsResponse {
  subscriptions?: AdminSubscription[]
  items?: AdminSubscription[]
  total?: number
}

// ============================================================================
// Requests
// ============================================================================

export interface GrantSubscriptionRequest {
  user_id: number
  plan_id: number
}

export interface UpdateResetLimitRequest {
  reset_quota_limit: number
}

// ============================================================================
// User search + groups
// ============================================================================

export interface AdminSearchUser {
  id: number
  username?: string
  email?: string
  display_name?: string
}

export interface UserGroupOption {
  label: string
  value: string
  ratio?: number
}
