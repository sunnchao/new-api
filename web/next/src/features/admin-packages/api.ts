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

// ============================================================================
// Subscriptions
// ============================================================================

export async function getAdminSubscriptions(
  params: { page?: number; page_size?: number } = {}
): Promise<ApiResponse<AdminSubscriptionsResponse>> {
  const { page = 1, page_size = 10 } = params
  const res = await api.get(
    `/api/packages-admin/subscriptions?page=${page}&page_size=${page_size}`
  )
  return res.data
}

export async function deleteSubscription(
  id: number
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.delete(`/api/packages-admin/subscriptions/${id}`)
  return res.data
}

export async function cancelSubscription(
  id: number
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.delete(`/api/packages-admin/subscriptions/${id}/cancel`)
  return res.data
}

export async function updateResetLimit(
  id: number,
  data: UpdateResetLimitRequest
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.put(
    `/api/packages-admin/subscriptions/${id}/reset-limit`,
    data
  )
  return res.data
}

export async function grantSubscription(
  data: GrantSubscriptionRequest
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.post('/api/packages-admin/grant-subscription', data)
  return res.data
}

// ============================================================================
// Plans
// ============================================================================

export async function getAdminPlans(): Promise<ApiResponse<AdminPlan[]>> {
  const res = await api.get('/api/packages-admin/plans')
  return res.data
}

export async function createPlan(
  data: AdminPlanPayload
): Promise<ApiResponse<AdminPlan>> {
  const res = await api.post('/api/packages-admin/plans', data)
  return res.data
}

export async function updatePlan(
  id: number,
  data: AdminPlanPayload
): Promise<ApiResponse<AdminPlan>> {
  const res = await api.put(`/api/packages-admin/plans/${id}`, data)
  return res.data
}

export async function deletePlan(
  id: number
): Promise<ApiResponse<{ message?: string }>> {
  const res = await api.delete(`/api/packages-admin/plans/${id}`)
  return res.data
}

// ============================================================================
// User search + groups
// ============================================================================

export async function searchUsers(
  keyword: string
): Promise<ApiResponse<AdminSearchUser[] | { users?: AdminSearchUser[] }>> {
  const res = await api.get(
    `/api/packages-admin/users/search?keyword=${encodeURIComponent(keyword)}`
  )
  return res.data
}

export async function getUserGroups(): Promise<
  ApiResponse<Record<string, { desc?: string; ratio?: number }>>
> {
  const res = await api.get('/api/user/self/groups')
  return res.data
}

export type { AdminPlan, AdminSubscription }
