"use client";

import { z } from "zod";
import { parseQuotaFromDollars, quotaUnitsToDollars } from "@/lib/format";
import { DEFAULT_GROUP } from "../constants";
import type { ApiKey, ApiKeyFormData } from "../types";

export const apiKeyFormSchema = z.object({
  name: z.string().min(1, "Please enter a name"),
  remain_quota_dollars: z.coerce.number().optional(),
  expired_time: z.string().optional(),
  unlimited_quota: z.boolean(),
  model_limits: z.string().optional(),
  allow_ips: z.string().optional(),
  group: z.string().optional(),
  cross_group_retry: z.boolean().optional(),
  backup_group: z.string().optional(),
  tokenCount: z.coerce.number().min(1).max(100).optional(),
});

export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const API_KEY_FORM_DEFAULT_VALUES: ApiKeyFormValues = {
  name: "",
  remain_quota_dollars: 10,
  expired_time: "",
  unlimited_quota: true,
  model_limits: "",
  allow_ips: "",
  group: DEFAULT_GROUP,
  cross_group_retry: true,
  backup_group: "",
  tokenCount: 1,
};

export function normalizeBackupGroups(value: string | undefined, primaryGroup = ""): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();
  const currentPrimaryGroup = primaryGroup.trim();

  for (const raw of (value || "").split(",")) {
    const group = raw.trim();
    if (!group || group === "auto") continue;
    if (currentPrimaryGroup && group === currentPrimaryGroup) continue;
    if (seen.has(group)) continue;
    seen.add(group);
    normalized.push(group);
  }

  return normalized;
}

export function transformFormDataToPayload(data: ApiKeyFormValues): ApiKeyFormData {
  const group = data.group || "";
  return {
    name: data.name,
    remain_quota: data.unlimited_quota
      ? 0
      : parseQuotaFromDollars(data.remain_quota_dollars || 0),
    expired_time: data.expired_time
      ? Math.floor(new Date(data.expired_time).getTime() / 1000)
      : -1,
    unlimited_quota: data.unlimited_quota,
    model_limits_enabled: Boolean(data.model_limits?.trim()),
    model_limits: data.model_limits || "",
    allow_ips: data.allow_ips || "",
    group,
    cross_group_retry: group === "auto" ? Boolean(data.cross_group_retry) : false,
    backup_group: normalizeBackupGroups(data.backup_group, group).join(","),
  };
}

export function transformApiKeyToFormDefaults(apiKey: ApiKey): ApiKeyFormValues {
  return {
    name: apiKey.name,
    remain_quota_dollars: quotaUnitsToDollars(apiKey.remain_quota),
    expired_time:
      apiKey.expired_time > 0
        ? new Date(apiKey.expired_time * 1000).toISOString().slice(0, 16)
        : "",
    unlimited_quota: apiKey.unlimited_quota,
    model_limits: apiKey.model_limits || "",
    allow_ips: apiKey.allow_ips || "",
    group: apiKey.group || DEFAULT_GROUP,
    cross_group_retry: Boolean(apiKey.cross_group_retry),
    backup_group: apiKey.backup_group || "",
    tokenCount: 1,
  };
}
