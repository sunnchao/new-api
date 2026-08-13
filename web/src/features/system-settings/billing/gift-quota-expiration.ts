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

export const giftQuotaExpirationPolicySchema = z
  .object({
    mode: z.enum(['permanent', 'duration']),
    unit: z.enum(['day', 'month']),
    value: z.coerce.number().int(),
  })
  .superRefine((policy, context) => {
    if (policy.mode === 'permanent') return
    const max = policy.unit === 'day' ? 3650 : 120
    if (policy.value < 1 || policy.value > max) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a valid duration',
      })
    }
  })

export type GiftQuotaExpirationPolicy = z.infer<
  typeof giftQuotaExpirationPolicySchema
>

export const PERMANENT_GIFT_QUOTA_EXPIRATION: GiftQuotaExpirationPolicy = {
  mode: 'permanent',
  unit: 'day',
  value: 0,
}

export function parseExpirationPolicy(raw: string): GiftQuotaExpirationPolicy {
  try {
    const parsed = giftQuotaExpirationPolicySchema.safeParse(JSON.parse(raw))
    if (parsed.success) return normalizeExpirationPolicy(parsed.data)
  } catch {
    // Invalid persisted values fall back to the backend default.
  }
  return PERMANENT_GIFT_QUOTA_EXPIRATION
}

export function serializeExpirationPolicy(
  policy: GiftQuotaExpirationPolicy
): string {
  return JSON.stringify(normalizeExpirationPolicy(policy))
}

function normalizeExpirationPolicy(
  policy: GiftQuotaExpirationPolicy
): GiftQuotaExpirationPolicy {
  if (policy.mode === 'permanent') return PERMANENT_GIFT_QUOTA_EXPIRATION
  return policy
}
