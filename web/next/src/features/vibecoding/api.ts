import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface VibeCodingSubscription {
  id: number;
  user_id: number;
  username: string;
  plan_type: string;
  status: "active" | "expired" | "cancelled";
  start_time: number;
  end_time: number;
}

export interface VibeCodingPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  features?: string[];
  recommended?: boolean;
}

export interface GrantSubscriptionData {
  user_id: number;
  plan_type: string;
  duration_days: number;
}

// ============================================================================
// Admin APIs
// ============================================================================

export async function getClaudeCodeAdminSubscriptions(): Promise<
  ApiResponse<VibeCodingSubscription[]>
> {
  const res = await api.get("/api/vibecoding/subscriptions");
  return res.data;
}

export async function grantClaudeCodeSubscription(
  data: GrantSubscriptionData
): Promise<ApiResponse> {
  const res = await api.post("/api/vibecoding/subscription/grant", data);
  return res.data;
}

export async function cancelClaudeCodeSubscription(
  id: number
): Promise<ApiResponse> {
  const res = await api.post(`/api/vibecoding/subscription/${id}/cancel`);
  return res.data;
}

// ============================================================================
// User APIs
// ============================================================================

export async function getMyClaudeCodeSubscriptions(): Promise<
  ApiResponse<VibeCodingSubscription[]>
> {
  const res = await api.get("/api/vibecoding/my-subscriptions");
  return res.data;
}

export async function getClaudeCodePlans(): Promise<
  ApiResponse<VibeCodingPlan[]>
> {
  const res = await api.get("/api/vibecoding/plans");
  return res.data;
}

export async function purchaseClaudeCodeSubscription(data: {
  plan_id: number;
}): Promise<ApiResponse> {
  const res = await api.post("/api/vibecoding/subscription/purchase", data);
  return res.data;
}
