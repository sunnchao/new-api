"use client";

import { z } from "zod";
import {
  API_KEY_FORM_DEFAULT_VALUES,
  apiKeyFormSchema,
  transformApiKeyToFormDefaults,
  transformFormDataToPayload,
  type ApiKeyFormValues,
} from "@/features/keys/lib/api-key-form";
import type { AdminToken, AdminTokenFormData } from "../types";

export const ADMIN_TOKEN_MJ_MODEL_OPTIONS = ["", "fast", "relax", "turbo"] as const;

export type AdminTokenMjModel = (typeof ADMIN_TOKEN_MJ_MODEL_OPTIONS)[number];

export const adminTokenFormSchema = apiKeyFormSchema.extend({
  user_id: z.coerce.number().int().positive("Please enter a valid user ID"),
  mj_model: z.enum(ADMIN_TOKEN_MJ_MODEL_OPTIONS),
});

export type AdminTokenFormValues = ApiKeyFormValues & {
  user_id: number;
  mj_model: AdminTokenMjModel;
};

export const ADMIN_TOKEN_FORM_DEFAULT_VALUES: AdminTokenFormValues = {
  ...API_KEY_FORM_DEFAULT_VALUES,
  user_id: 0,
  mj_model: "",
};

export function transformAdminTokenFormDataToPayload(
  data: AdminTokenFormValues,
): AdminTokenFormData {
  return {
    ...transformFormDataToPayload(data),
    user_id: data.user_id,
    mj_model: data.mj_model,
  };
}

export function transformAdminTokenToFormDefaults(token: AdminToken): AdminTokenFormValues {
  return {
    ...transformApiKeyToFormDefaults(token),
    user_id: token.user_id,
    mj_model:
      ADMIN_TOKEN_MJ_MODEL_OPTIONS.find((option) => option === token.mj_model) ?? "",
  };
}
