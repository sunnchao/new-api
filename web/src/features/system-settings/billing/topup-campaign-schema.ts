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

import { parseUtc8DateTimeInput } from '@/features/topup-campaign/lib/settings'

export const MAX_TOPUP_CAMPAIGN_TIERS = 20
export const MAX_TOPUP_CAMPAIGN_PERIODS = 20
export const MAX_TOPUP_CAMPAIGN_WHITELIST_USER_IDS = 1000

export function parseWhitelistUserIdsInput(value: string): number[] | null {
  const tokens = value.split(/[\s,，]+/).filter(Boolean)
  const userIds = new Set<number>()
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) return null
    const userId = Number(token)
    if (!Number.isSafeInteger(userId) || userId <= 0) return null
    userIds.add(userId)
  }
  return [...userIds].sort((a, b) => a - b)
}

export const createTopupCampaignPeriodSchema = (t: (key: string) => string) =>
  z
    .object({
      campaignKey: z
        .string()
        .trim()
        .min(1, t('Campaign key cannot be empty'))
        .max(64, t('Campaign key cannot exceed 64 characters')),
      start: z.string(),
      end: z.string(),
      dayStart: z.string(),
      dayEnd: z.string(),
      dayBonusRatePercent: z.coerce.number().min(0).max(100),
      tiers: z
        .array(
          z.object({
            min_amount: z.coerce
              .number()
              .positive(t('Tier amounts must be greater than 0')),
            bonus_amount: z.coerce
              .number()
              .positive(t('Tier amounts must be greater than 0')),
          })
        )
        .min(1, t('Enter at least one tier'))
        .max(MAX_TOPUP_CAMPAIGN_TIERS, t('At most 20 tiers')),
      whitelistUserIds: z.string(),
    })
    .superRefine((values, ctx) => {
      const start = parseUtc8DateTimeInput(values.start)
      const end = parseUtc8DateTimeInput(values.end)
      const dayStart = parseUtc8DateTimeInput(values.dayStart)
      const dayEnd = parseUtc8DateTimeInput(values.dayEnd)

      if (start === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['start'],
          message: t('Invalid date'),
        })
      }
      if (end === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end'],
          message: t('Invalid date'),
        })
      }
      if (values.dayStart && dayStart === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dayStart'],
          message: t('Invalid date'),
        })
      }
      if (values.dayEnd && dayEnd === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dayEnd'],
          message: t('Invalid date'),
        })
      }
      if (start !== null && end !== null && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end'],
          message: t('End time must be after start time'),
        })
      }
      if (dayStart !== null && dayEnd !== null && dayEnd <= dayStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dayEnd'],
          message: t('Bonus day end must be after bonus day start'),
        })
      }
      if (
        dayStart !== null &&
        dayEnd !== null &&
        start !== null &&
        end !== null &&
        (dayStart < start || dayEnd > end)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dayStart'],
          message: t('Bonus day must be within the campaign period'),
        })
      }

      const whitelist = parseWhitelistUserIdsInput(values.whitelistUserIds)
      if (whitelist === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['whitelistUserIds'],
          message: t('Enter valid numeric user IDs separated by commas'),
        })
      } else if (whitelist.length > MAX_TOPUP_CAMPAIGN_WHITELIST_USER_IDS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['whitelistUserIds'],
          message: t('At most 1000 whitelist user IDs'),
        })
      }

      const tierMessage = t('Tiers must be ordered by minimum amount.')
      let previousMin = 0
      values.tiers.forEach((tier, index) => {
        if (index > 0 && tier.min_amount <= previousMin) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tiers', index, 'min_amount'],
            message: tierMessage,
          })
        }
        previousMin = tier.min_amount
      })
    })

export const createTopupCampaignListSchema = (t: (key: string) => string) =>
  z
    .array(createTopupCampaignPeriodSchema(t))
    .min(1, t('Enter at least one campaign period'))
    .max(MAX_TOPUP_CAMPAIGN_PERIODS, t('At most 20 campaign periods'))
    .superRefine((periods, ctx) => {
      const seen = new Set<string>()
      periods.forEach((period, index) => {
        const key = period.campaignKey.trim()
        if (!key || !seen.has(key)) {
          seen.add(key)
          return
        }
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'campaignKey'],
          message: t('Campaign keys must be unique across periods'),
        })
      })

      const windows = periods.map((period) => ({
        start: parseUtc8DateTimeInput(period.start),
        end: parseUtc8DateTimeInput(period.end),
      }))
      for (let i = 0; i < windows.length; i++) {
        for (let j = i + 1; j < windows.length; j++) {
          const first = windows[i]
          const second = windows[j]
          if (
            first.start === null ||
            first.end === null ||
            second.start === null ||
            second.end === null ||
            first.end < second.start ||
            second.end < first.start
          ) {
            continue
          }
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [j, 'start'],
            message: t('Campaign periods cannot overlap'),
          })
        }
      }
    })

export const createTopupCampaignSchema = (t: (key: string) => string) =>
  z.object({
    enabled: z.boolean(),
    periods: createTopupCampaignListSchema(t),
  })

export type TopupCampaignFormValues = z.infer<
  ReturnType<typeof createTopupCampaignSchema>
>
export type TopupCampaignPeriodFormValues = z.infer<
  ReturnType<typeof createTopupCampaignPeriodSchema>
>
