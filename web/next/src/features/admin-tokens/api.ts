"use client";

import { api } from "@/lib/api";
import type {
  AdminToken,
  AdminTokenCreatePayload,
  AdminTokenUpdatePayload,
  ApiResponse,
  GetAdminTokensParams,
  GetAdminTokensResponse,
  SearchAdminTokensParams,
} from "./types";

export async function getAdminTokens(
  params: GetAdminTokensParams = {},
): Promise<GetAdminTokensResponse> {
  const { p = 1, page_size = 20 } = params;
  const res = await api.get(`/api/admin/token/list?p=${p}&page_size=${page_size}`);
  return res.data;
}

export async function searchAdminTokens(
  params: SearchAdminTokensParams = {},
): Promise<GetAdminTokensResponse> {
  const { keyword = "", token = "", p = 1, page_size = 20 } = params;
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.set("keyword", keyword);
  if (token) queryParams.set("token", token);
  queryParams.set("p", String(p));
  queryParams.set("page_size", String(page_size));

  const res = await api.get(`/api/admin/token/search?${queryParams.toString()}`);
  return res.data;
}

export async function getAdminToken(id: number): Promise<ApiResponse<AdminToken>> {
  const res = await api.get(`/api/admin/token/${id}`);
  return res.data;
}

export async function createAdminToken(
  data: AdminTokenCreatePayload,
): Promise<ApiResponse<AdminToken>> {
  const res = await api.post("/api/admin/token", data);
  return res.data;
}

export async function updateAdminToken(
  data: AdminTokenUpdatePayload,
): Promise<ApiResponse<AdminToken>> {
  const res = await api.put("/api/admin/token", data);
  return res.data;
}

export async function updateAdminTokenStatus(
  id: number,
  status: number,
): Promise<ApiResponse<AdminToken>> {
  const res = await api.put("/api/admin/token?status_only=true", { id, status });
  return res.data;
}

export async function deleteAdminToken(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/admin/token/${id}`);
  return res.data;
}

export async function batchDeleteAdminTokens(ids: number[]): Promise<ApiResponse<number>> {
  const res = await api.post("/api/admin/token/batch", { ids });
  return res.data;
}
