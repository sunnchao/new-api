"use client";

import { api } from "@/lib/api";
import type {
  ApiKey,
  ApiKeyFormData,
  ApiResponse,
  GetApiKeysParams,
  GetApiKeysResponse,
  SearchApiKeysParams,
} from "./types";

export async function getApiKeys(params: GetApiKeysParams = {}): Promise<GetApiKeysResponse> {
  const { p = 1, size = 10 } = params;
  const res = await api.get(`/api/token/?p=${p}&size=${size}`);
  return res.data;
}

export async function searchApiKeys(
  params: SearchApiKeysParams,
): Promise<{ success: boolean; message?: string; data?: ApiKey[] }> {
  const { keyword = "", token = "", p, size } = params;
  const queryParams = new URLSearchParams();
  if (keyword) queryParams.set("keyword", keyword);
  if (token) queryParams.set("token", token);
  if (p != null) queryParams.set("p", String(p));
  if (size != null) queryParams.set("size", String(size));
  const res = await api.get(`/api/token/search?${queryParams.toString()}`);
  return res.data;
}

export async function getApiKey(id: number): Promise<ApiResponse<ApiKey>> {
  const res = await api.get(`/api/token/${id}`);
  return res.data;
}

export async function createApiKey(data: ApiKeyFormData): Promise<ApiResponse<ApiKey>> {
  const res = await api.post("/api/token/", data);
  return res.data;
}

export async function updateApiKey(
  data: ApiKeyFormData & { id: number },
): Promise<ApiResponse<ApiKey>> {
  const res = await api.put("/api/token/", data);
  return res.data;
}

export async function deleteApiKey(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/token/${id}/`);
  return res.data;
}

export async function batchDeleteApiKeys(ids: number[]): Promise<ApiResponse<number>> {
  const res = await api.post("/api/token/batch", { ids });
  return res.data;
}

export async function updateApiKeyStatus(
  id: number,
  status: number,
): Promise<ApiResponse<ApiKey>> {
  const res = await api.put("/api/token/?status_only=true", { id, status });
  return res.data;
}

export async function fetchTokenKey(
  id: number,
): Promise<{ success: boolean; message?: string; data?: { key: string } }> {
  const res = await api.post(`/api/token/${id}/key`);
  return res.data;
}

export async function fetchTokenKeysBatch(ids: number[]): Promise<{
  success: boolean;
  message?: string;
  data?: { keys: Record<number, string> };
}> {
  const res = await api.post("/api/token/batch/keys", { ids });
  return res.data;
}
