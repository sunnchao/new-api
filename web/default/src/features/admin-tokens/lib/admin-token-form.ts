import { z } from 'zod'
import type { TFunction } from 'i18next'
import {
  API_KEY_FORM_DEFAULT_VALUES,
  getApiKeyFormBaseSchema,
  getApiKeyFormDefaultValues,
  transformApiKeyToFormDefaults,
  transformFormDataToPayload,
  type ApiKeyFormValues,
} from '@/features/keys/lib/api-key-form'
import type { AdminToken, AdminTokenFormData } from '../types'

export const ADMIN_TOKEN_MJ_MODEL_OPTIONS = [
  '',
  'fast',
  'relax',
  'turbo',
] as const

export type AdminTokenMjModel = (typeof ADMIN_TOKEN_MJ_MODEL_OPTIONS)[number]

export function getAdminTokenFormSchema(t: TFunction) {
  return getApiKeyFormBaseSchema(t)
    .extend({
      user_id: z.number().int().positive('Please enter a valid user ID'),
      mj_model: z.enum(ADMIN_TOKEN_MJ_MODEL_OPTIONS),
    })
    .superRefine((data, ctx) => {
      if (data.unlimited_quota) {
        return
      }

      if (
        data.remain_quota_dollars === undefined ||
        data.remain_quota_dollars < 0
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['remain_quota_dollars'],
          message: t('Quota must be zero or greater'),
        })
      }
    })
}

export type AdminTokenFormValues = ApiKeyFormValues & {
  user_id: number
  mj_model: AdminTokenMjModel
}

export const ADMIN_TOKEN_FORM_DEFAULT_VALUES: AdminTokenFormValues = {
  ...API_KEY_FORM_DEFAULT_VALUES,
  user_id: 0,
  mj_model: '',
}

export function getAdminTokenFormDefaultValues(
  defaultUseAutoGroup: boolean
): AdminTokenFormValues {
  return {
    ...getApiKeyFormDefaultValues(defaultUseAutoGroup),
    user_id: 0,
    mj_model: '',
  }
}

export function transformAdminTokenFormDataToPayload(
  data: AdminTokenFormValues
): AdminTokenFormData {
  return {
    ...transformFormDataToPayload(data),
    user_id: data.user_id,
    mj_model: data.mj_model,
  }
}

export function transformAdminTokenToFormDefaults(
  token: AdminToken
): AdminTokenFormValues {
  return {
    ...transformApiKeyToFormDefaults(token),
    user_id: token.user_id,
    mj_model:
      ADMIN_TOKEN_MJ_MODEL_OPTIONS.find(
        (option) => option === token.mj_model
      ) ?? '',
  }
}
