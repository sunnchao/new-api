"use client";

import { api } from "@/lib/api";
import type { QuotaDataItem, UptimeGroupResult } from "./types";

export async function getUserQuotaDates(
  params: {
    start_timestamp?: number;
    end_timestamp?: number;
    default_time?: string;
    username?: string;
  } = {},
  isAdmin = false,
) {
  const endpoint = isAdmin ? "/api/data" : "/api/data/self";
  const res = await api.get<{ success: boolean; data: QuotaDataItem[] }>(
    endpoint,
    { params },
  );
  return res.data;
}

export async function getUserQuotaDataByUsers(
  params: {
    start_timestamp?: number;
    end_timestamp?: number;
  } = {},
) {
  const res = await api.get<{ success: boolean; data: QuotaDataItem[] }>(
    "/api/data/users",
    { params },
  );
  return res.data;
}

export async function getUptimeStatus() {
  const res = await api.get<{ success: boolean; data: UptimeGroupResult[] }>(
    "/api/uptime/status",
  );
  return res.data;
}
