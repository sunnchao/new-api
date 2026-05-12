"use client";

import { z } from "zod";
import { parseQuotaFromDollars, quotaUnitsToDollars } from "@/lib/format";
import {
  REDEMPTION_VALIDATION,
} from "../constants";
import { REDEMPTION_TYPES, type Redemption, type RedemptionFormData } from "../types";

export const redemptionFormSchema = z.object({
  name: z
    .string()
    .min(REDEMPTION_VALIDATION.NAME_MIN_LENGTH, "Name is required")
    .max(REDEMPTION_VALIDATION.NAME_MAX_LENGTH, "Name is too long"),
  quota_dollars: z.coerce.number().optional(),
  type: z.enum([REDEMPTION_TYPES.QUOTA, REDEMPTION_TYPES.SUBSCRIPTION]),
  subscription_plan_id: z.coerce.number().optional(),
  expired_time: z.string().optional(),
  count: z.coerce
    .number()
    .min(REDEMPTION_VALIDATION.COUNT_MIN)
    .max(REDEMPTION_VALIDATION.COUNT_MAX)
    .optional(),
});

export type RedemptionFormValues = z.infer<typeof redemptionFormSchema>;

export const REDEMPTION_FORM_DEFAULT_VALUES: RedemptionFormValues = {
  name: "",
  quota_dollars: 10,
  type: REDEMPTION_TYPES.QUOTA,
  subscription_plan_id: undefined,
  expired_time: "",
  count: 1,
};

export function transformFormDataToPayload(data: RedemptionFormValues): RedemptionFormData {
  const isSubscription = data.type === REDEMPTION_TYPES.SUBSCRIPTION;
  return {
    name: data.name,
    quota: isSubscription ? 0 : parseQuotaFromDollars(data.quota_dollars ?? 0),
    type: data.type,
    subscription_plan_id: isSubscription ? data.subscription_plan_id || 0 : 0,
    expired_time: data.expired_time
      ? Math.floor(new Date(data.expired_time).getTime() / 1000)
      : 0,
    count: data.count || 1,
  };
}

export function transformRedemptionToFormDefaults(redemption: Redemption): RedemptionFormValues {
  const type =
    redemption.type === REDEMPTION_TYPES.SUBSCRIPTION
      ? REDEMPTION_TYPES.SUBSCRIPTION
      : REDEMPTION_TYPES.QUOTA;

  return {
    name: redemption.name,
    quota_dollars: quotaUnitsToDollars(redemption.quota),
    type,
    subscription_plan_id: redemption.subscription_plan_id || undefined,
    expired_time:
      redemption.expired_time > 0
        ? new Date(redemption.expired_time * 1000).toISOString().slice(0, 16)
        : "",
    count: 1,
  };
}
