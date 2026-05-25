/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { z } from 'zod'
import type { TFunction } from 'i18next'
import { parseQuotaFromDollars, quotaUnitsToDollars } from '@/lib/format'
import { DEFAULT_GROUP } from '../constants'
import { type ApiKeyFormData, type ApiKey } from '../types'

// ============================================================================
// Form Schema
// ============================================================================

export function getApiKeyFormBaseSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('Please enter a name')),
    remain_quota_dollars: z.number().optional(),
    expired_time: z.date().optional(),
    unlimited_quota: z.boolean(),
    model_limits: z.array(z.string()),
    allow_ips: z.string().optional(),
    group: z.string().optional(),
    cross_group_retry: z.boolean().optional(),
    backup_group: z.array(z.string()).optional(),
    tokenCount: z.number().min(1).optional(),
  })
}

export function getApiKeyFormSchema(t: TFunction) {
  return getApiKeyFormBaseSchema(t).superRefine((data, ctx) => {
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

export type ApiKeyFormValues = z.infer<ReturnType<typeof getApiKeyFormSchema>>

// ============================================================================
// Form Defaults
// ============================================================================

export const API_KEY_FORM_DEFAULT_VALUES: ApiKeyFormValues = {
  name: '',
  remain_quota_dollars: 10,
  expired_time: undefined,
  unlimited_quota: true,
  model_limits: [],
  allow_ips: '',
  group: DEFAULT_GROUP,
  cross_group_retry: true,
  backup_group: [],
  tokenCount: 1,
}

export function getApiKeyFormDefaultValues(
  defaultUseAutoGroup: boolean
): ApiKeyFormValues {
  return {
    ...API_KEY_FORM_DEFAULT_VALUES,
    group: defaultUseAutoGroup ? 'auto' : DEFAULT_GROUP,
    cross_group_retry: defaultUseAutoGroup,
    backup_group: [],
  }
}

// ============================================================================
// Form Data Transformation
// ============================================================================

/**
 * Normalize backup groups to the ordered fallback chain accepted by the API.
 */
export function normalizeBackupGroups(
  groupList: string[] | undefined,
  primaryGroup = ''
): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()
  const currentPrimaryGroup = primaryGroup.trim()

  for (const group of groupList ?? []) {
    const groupName = group.trim()
    if (!groupName || groupName === 'auto') continue
    if (currentPrimaryGroup && groupName === currentPrimaryGroup) continue
    if (seen.has(groupName)) continue

    seen.add(groupName)
    normalized.push(groupName)
  }

  return normalized
}

/**
 * Keep the backup group list tidy while the user is still editing it.
 *
 * Empty rows are preserved here so clicking "Add backup group" has visible
 * feedback; the final API payload still uses normalizeBackupGroups().
 */
export function normalizeBackupGroupDraft(
  groupList: string[] | undefined,
  primaryGroup = ''
): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()
  const currentPrimaryGroup = primaryGroup.trim()

  for (const group of groupList ?? []) {
    const groupName = group.trim()
    if (!groupName) {
      if (!normalized.includes('')) {
        normalized.push('')
      }
      continue
    }
    if (groupName === 'auto') continue
    if (currentPrimaryGroup && groupName === currentPrimaryGroup) continue
    if (seen.has(groupName)) continue

    seen.add(groupName)
    normalized.push(groupName)
  }

  return normalized
}

/**
 * Transform form data to API payload
 */
export function transformFormDataToPayload(
  data: ApiKeyFormValues
): ApiKeyFormData {
  const group = data.group || ''

  return {
    name: data.name,
    remain_quota: data.unlimited_quota
      ? 0
      : parseQuotaFromDollars(data.remain_quota_dollars || 0),
    expired_time: data.expired_time
      ? Math.floor(data.expired_time.getTime() / 1000)
      : -1,
    unlimited_quota: data.unlimited_quota,
    model_limits_enabled: data.model_limits.length > 0,
    model_limits: data.model_limits.join(','),
    allow_ips: data.allow_ips || '',
    group,
    cross_group_retry: group === 'auto' ? !!data.cross_group_retry : false,
    backup_group: normalizeBackupGroups(data.backup_group, group).join(','),
  }
}

/**
 * Transform API key data to form defaults
 */
export function transformApiKeyToFormDefaults(
  apiKey: ApiKey
): ApiKeyFormValues {
  return {
    name: apiKey.name,
    remain_quota_dollars: apiKey.unlimited_quota
      ? 0
      : quotaUnitsToDollars(apiKey.remain_quota),
    expired_time:
      apiKey.expired_time > 0
        ? new Date(apiKey.expired_time * 1000)
        : undefined,
    unlimited_quota: apiKey.unlimited_quota,
    model_limits: apiKey.model_limits
      ? apiKey.model_limits.split(',').filter(Boolean)
      : [],
    allow_ips: apiKey.allow_ips || '',
    group: apiKey.group || DEFAULT_GROUP,
    cross_group_retry: !!apiKey.cross_group_retry,
    backup_group: normalizeBackupGroups(
      apiKey.backup_group ? apiKey.backup_group.split(',') : [],
      apiKey.group || DEFAULT_GROUP
    ),
    tokenCount: 1,
  }
}
