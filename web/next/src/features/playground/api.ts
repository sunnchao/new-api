"use client";

import { api } from "@/lib/api";

export async function getPlaygroundModels(): Promise<string[]> {
  const res = await api.get("/api/user/models");
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getPlaygroundGroups(): Promise<string[]> {
  const res = await api.get("/api/user/self/groups");
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return Object.keys(data);
  return [];
}
