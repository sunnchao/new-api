"use client";

import { z } from "zod";

export const REDEMPTION_TYPES = {
  QUOTA: "quota",
  SUBSCRIPTION: "subscription",
} as const;

export const redemptionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  key: z.string(),
  status: z.number(),
  quota: z.number(),
  type: z.string().optional(),
  subscription_plan_id: z.number().optional(),
  created_time: z.number(),
  redeemed_time: z.number().optional().default(0),
  expired_time: z.number(),
  used_user_id: z.number().optional().default(0),
});

export type Redemption = z.infer<typeof redemptionSchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GetRedemptionsParams {
  p?: number;
  page_size?: number;
}

export interface GetRedemptionsResponse {
  success: boolean;
  message?: string;
  data?: {
    items: Redemption[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface SearchRedemptionsParams {
  keyword?: string;
  p?: number;
  page_size?: number;
}

export interface RedemptionFormData {
  id?: number;
  name: string;
  quota: number;
  type?: string;
  subscription_plan_id?: number;
  expired_time: number;
  count?: number;
  status?: number;
}

export type RedemptionsDialogType = "create" | "update" | "delete" | "view";
