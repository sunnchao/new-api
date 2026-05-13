import { api } from "@/lib/api";
import type { ApiResponse, BillingHistoryResponse, PaymentPayload } from "./types";

export function isApiSuccess(response: ApiResponse): boolean {
  return response.success === true || response.message === "success";
}

export async function getTopupInfo(): Promise<ApiResponse> {
  const res = await api.get("/api/user/topup/info");
  return res.data;
}

export async function redeemTopupCode(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/topup", payload);
  return res.data;
}

export async function calculateAmount(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/amount", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function calculateStripeAmount(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/stripe/amount", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function requestPayment(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/pay", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function requestStripePayment(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/stripe/pay", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function requestCreemPayment(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/creem/pay", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function requestWaffoPayment(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/waffo/pay", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function calculateWaffoPancakeAmount(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/waffo-pancake/amount", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function requestWaffoPancakePayment(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/waffo-pancake/pay", payload, {
    skipBusinessError: true,
  } as Record<string, unknown>);
  return res.data;
}

export async function getAffiliateCode(): Promise<ApiResponse> {
  const res = await api.get("/api/user/aff");
  return res.data;
}

export async function transferAffiliateQuota(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/aff_transfer", payload);
  return res.data;
}

export async function getUserBillingHistory(
  page: number,
  pageSize: number,
  keyword?: string,
): Promise<ApiResponse<BillingHistoryResponse>> {
  const params = new URLSearchParams({
    p: page.toString(),
    page_size: pageSize.toString(),
  });
  if (keyword) params.append("keyword", keyword);
  const res = await api.get(`/api/user/topup/self?${params.toString()}`);
  return res.data;
}

export async function getAllBillingHistory(
  page: number,
  pageSize: number,
  keyword?: string,
): Promise<ApiResponse<BillingHistoryResponse>> {
  const params = new URLSearchParams({
    p: page.toString(),
    page_size: pageSize.toString(),
  });
  if (keyword) params.append("keyword", keyword);
  const res = await api.get(`/api/user/topup?${params.toString()}`);
  return res.data;
}

export async function completeOrder(payload: PaymentPayload): Promise<ApiResponse> {
  const res = await api.post("/api/user/topup/complete", payload);
  return res.data;
}
