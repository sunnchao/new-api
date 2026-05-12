"use client";

import { api } from "@/lib/api";
import type {
  ApiResponse,
  GetRedemptionsParams,
  GetRedemptionsResponse,
  Redemption,
  RedemptionFormData,
  SearchRedemptionsParams,
} from "./types";

export async function getRedemptions(
  params: GetRedemptionsParams = {},
): Promise<GetRedemptionsResponse> {
  const { p = 1, page_size = 10 } = params;
  const res = await api.get(`/api/redemption/?p=${p}&page_size=${page_size}`);
  return res.data;
}

export async function searchRedemptions(
  params: SearchRedemptionsParams,
): Promise<GetRedemptionsResponse> {
  const { keyword = "", p = 1, page_size = 10 } = params;
  const res = await api.get(
    `/api/redemption/search?keyword=${keyword}&p=${p}&page_size=${page_size}`,
  );
  return res.data;
}

export async function getRedemption(id: number): Promise<ApiResponse<Redemption>> {
  const res = await api.get(`/api/redemption/${id}`);
  return res.data;
}

export async function createRedemption(
  data: RedemptionFormData,
): Promise<ApiResponse<string[]>> {
  const res = await api.post("/api/redemption/", data);
  return res.data;
}

export async function updateRedemption(
  data: RedemptionFormData & { id: number },
): Promise<ApiResponse<Redemption>> {
  const res = await api.put("/api/redemption/", data);
  return res.data;
}

export async function updateRedemptionStatus(
  id: number,
  status: number,
): Promise<ApiResponse<Redemption>> {
  const res = await api.put("/api/redemption/?status_only=true", { id, status });
  return res.data;
}

export async function deleteRedemption(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/redemption/${id}/`);
  return res.data;
}

export async function deleteInvalidRedemptions(): Promise<ApiResponse<number>> {
  const res = await api.delete("/api/redemption/invalid");
  return res.data;
}

export interface SubscriptionPlanOption {
  id: number;
  title?: string;
  name?: string;
  price?: number;
  price_amount?: number;
}

export async function getAdminSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlanOption[]>> {
  const res = await api.get("/api/subscription/admin/plans");
  return res.data;
}
