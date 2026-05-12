"use client";

import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.number(),
  name: z.string(),
  key: z.string(),
  status: z.number(),
  remain_quota: z.number(),
  used_quota: z.number(),
  unlimited_quota: z.boolean(),
  expired_time: z.number(),
  created_time: z.number(),
  accessed_time: z.number().optional().default(0),
  group: z.string().nullish().default(""),
  cross_group_retry: z.preprocess((value) => {
    if (value === 1) return true;
    if (value === 0) return false;
    return value;
  }, z.boolean()).optional().default(false),
  model_limits_enabled: z.boolean().optional().default(false),
  model_limits: z.string().nullish().default(""),
  allow_ips: z.string().nullish().default(""),
  backup_group: z.string().nullish().default(""),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GetApiKeysParams {
  p?: number;
  size?: number;
}

export interface GetApiKeysResponse {
  success: boolean;
  message?: string;
  data?: {
    items: ApiKey[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface SearchApiKeysParams {
  keyword?: string;
  token?: string;
  p?: number;
  size?: number;
}

export interface ApiKeyFormData {
  name: string;
  remain_quota: number;
  expired_time: number;
  unlimited_quota: boolean;
  model_limits_enabled: boolean;
  model_limits: string;
  allow_ips: string;
  group: string;
  cross_group_retry: boolean;
  backup_group: string;
}

export type ApiKeysDialogType = "create" | "update" | "delete" | "batch-delete";
