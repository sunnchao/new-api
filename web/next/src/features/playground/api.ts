"use client";

import { api } from "@/lib/api";
import type { PlaygroundTokenOption } from "./types";

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

export async function getPlaygroundTokens(): Promise<PlaygroundTokenOption[]> {
  const res = await api.get("/api/token/", {
    params: { p: 0, size: 100 },
  });
  const data = res.data?.data;
  return Array.isArray(data) ? data : data?.items || [];
}
