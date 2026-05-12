"use client";

import { api } from "@/lib/api";
import type {
  AdminAllSubscriptionsParams,
  ApiResponse,
  PlanPayload,
  SubscriptionPayRequest,
} from "./types";

export async function getAdminPlans(): Promise<ApiResponse> {
  const res = await api.get("/api/subscription/admin/plans");
  return res.data;
}

export async function createPlan(data: PlanPayload): Promise<ApiResponse> {
  const res = await api.post("/api/subscription/admin/plans", data);
  return res.data;
}

export async function updatePlan(id: number, data: PlanPayload): Promise<ApiResponse> {
  const res = await api.put(`/api/subscription/admin/plans/${id}`, data);
  return res.data;
}

export async function patchPlanStatus(id: number, enabled: boolean): Promise<ApiResponse> {
  const res = await api.patch(`/api/subscription/admin/plans/${id}`, { enabled });
  return res.data;
}

export async function getUserSubscriptions(userId: number): Promise<ApiResponse> {
  const res = await api.get(`/api/subscription/admin/users/${userId}/subscriptions`);
  return res.data;
}

export async function createUserSubscription(
  userId: number,
  data: Record<string, unknown>,
): Promise<ApiResponse> {
  const res = await api.post(`/api/subscription/admin/users/${userId}/subscriptions`, data);
  return res.data;
}

export async function invalidateUserSubscription(subId: number): Promise<ApiResponse> {
  const res = await api.post(`/api/subscription/admin/user_subscriptions/${subId}/invalidate`);
  return res.data;
}

export async function deleteUserSubscription(subId: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/subscription/admin/user_subscriptions/${subId}`);
  return res.data;
}

export async function getAllUserSubscriptions(
  params: AdminAllSubscriptionsParams = {},
): Promise<ApiResponse> {
  const res = await api.get("/api/subscription/admin/all", { params });
  return res.data;
}

export async function paySubscriptionStripe(data: SubscriptionPayRequest): Promise<ApiResponse> {
  const res = await api.post("/api/subscription/stripe/pay", data);
  return res.data;
}

export async function paySubscriptionCreem(data: SubscriptionPayRequest): Promise<ApiResponse> {
  const res = await api.post("/api/subscription/creem/pay", data);
  return res.data;
}

export async function paySubscriptionBalance(data: SubscriptionPayRequest): Promise<ApiResponse> {
  const res = await api.post("/api/subscription/balance/pay", data);
  return res.data;
}

export async function paySubscriptionEpay(data: SubscriptionPayRequest): Promise<ApiResponse> {
  const res = await api.post("/api/subscription/epay/pay", data);
  return res.data;
}

export async function getSelfSubscriptions(): Promise<ApiResponse> {
  const res = await api.get("/api/subscription/self");
  return res.data;
}

export async function getSelfSubscriptionFull(): Promise<ApiResponse> {
  const res = await api.get("/api/subscription/self");
  return res.data;
}

export async function getPublicPlans(): Promise<ApiResponse> {
  const res = await api.get("/api/subscription/plans");
  return res.data;
}

export async function getHomePlans(): Promise<ApiResponse> {
  const res = await api.get("/api/subscription/home/plans");
  return res.data;
}

export async function updateBillingPreference(preference: string): Promise<ApiResponse> {
  const res = await api.put("/api/subscription/self/preference", {
    billing_preference: preference,
  });
  return res.data;
}

export async function getGroups(): Promise<ApiResponse> {
  const res = await api.get("/api/group");
  return res.data;
}
