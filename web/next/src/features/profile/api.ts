"use client";

import { api } from "@/lib/api";
import type { ApiResponse, UserProfilePayload } from "./types";

export async function getUserProfile(): Promise<ApiResponse> {
  const res = await api.get("/api/user/self");
  return res.data;
}

export async function updateUserProfile(data: UserProfilePayload): Promise<ApiResponse> {
  const res = await api.put("/api/user/self", data);
  return res.data;
}

export async function updateUserSettings(data: UserProfilePayload): Promise<ApiResponse> {
  const res = await api.put("/api/user/setting", data);
  return res.data;
}

export async function updateUserLanguage(language: string): Promise<ApiResponse> {
  const res = await api.put("/api/user/self", { language });
  return res.data;
}

export async function deleteUserAccount(data?: UserProfilePayload): Promise<ApiResponse> {
  const res = await api.delete("/api/user/self", { data });
  return res.data;
}

export async function generateAccessToken(): Promise<ApiResponse<string>> {
  const res = await api.get("/api/user/token");
  return res.data;
}

export async function sendEmailVerification(
  email: string,
  turnstileToken?: string,
): Promise<ApiResponse> {
  const params = new URLSearchParams({ email });
  if (turnstileToken) params.append("turnstile", turnstileToken);
  const res = await api.get(`/api/verification?${params}`);
  return res.data;
}

export async function bindEmail(email: string, code: string): Promise<ApiResponse> {
  const res = await api.post("/api/oauth/email/bind", { email, code });
  return res.data;
}

export async function bindWeChat(code: string): Promise<ApiResponse> {
  const res = await api.get(`/api/oauth/wechat/bind?code=${code}`);
  return res.data;
}

export async function getSelfOAuthBindings(): Promise<ApiResponse> {
  const res = await api.get("/api/user/oauth/bindings");
  return res.data;
}

export async function unbindCustomOAuth(providerId: string): Promise<ApiResponse> {
  const res = await api.delete(`/api/user/oauth/bindings/${providerId}`);
  return res.data;
}

export async function getCheckinStatus(month: string): Promise<ApiResponse> {
  const res = await api.get(`/api/user/checkin?month=${month}`);
  return res.data;
}

export async function performCheckin(turnstileToken?: string): Promise<ApiResponse> {
  const url = turnstileToken
    ? `/api/user/checkin?turnstile=${encodeURIComponent(turnstileToken)}`
    : "/api/user/checkin";
  const res = await api.post(url);
  return res.data;
}
