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
import type { TopupCampaignTier } from '../types'

const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000
const DATE_TIME_INPUT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Formats Unix seconds as a `datetime-local` value in the campaign's reference
 * timezone (UTC+8), e.g. `2026-11-06T00:00`.
 */
export function formatUtc8DateTimeInput(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return ''
  const shifted = new Date(unixSeconds * 1000 + UTC8_OFFSET_MS)
  const date = `${shifted.getUTCFullYear()}-${padTwo(shifted.getUTCMonth() + 1)}-${padTwo(shifted.getUTCDate())}`
  const time = `${padTwo(shifted.getUTCHours())}:${padTwo(shifted.getUTCMinutes())}`
  return `${date}T${time}`
}

/**
 * Parses a `datetime-local` value as UTC+8 and returns Unix seconds, or null
 * when the value is malformed or names a date that does not exist.
 */
export function parseUtc8DateTimeInput(value: string): number | null {
  const match = DATE_TIME_INPUT_PATTERN.exec(value.trim())
  if (!match) return null
  const [, year, month, day, hour, minute, second] = match
  const unixMs =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second ?? 0)
    ) - UTC8_OFFSET_MS
  if (!Number.isFinite(unixMs)) return null
  const unixSeconds = Math.floor(unixMs / 1000)
  // Reject values Date normalizes into another day, e.g. 2026-02-30.
  if (formatUtc8DateTimeInput(unixSeconds) !== value.trim().slice(0, 16)) {
    return null
  }
  return unixSeconds
}

/** Parses the `tiers` option value; malformed entries are dropped. */
export function parseTierSetting(value: string): TopupCampaignTier[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const tiers: TopupCampaignTier[] = []
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const minAmount = Number(record.min_amount)
    const bonusAmount = Number(record.bonus_amount)
    if (
      !Number.isFinite(minAmount) ||
      !Number.isFinite(bonusAmount) ||
      minAmount <= 0 ||
      bonusAmount <= 0
    ) {
      continue
    }
    tiers.push({ min_amount: minAmount, bonus_amount: bonusAmount })
  }
  return tiers.sort((a, b) => a.min_amount - b.min_amount)
}

export interface TopupCampaignPeriodSetting {
  campaign_key: string
  start_time: number
  end_time: number
  day_bonus_start: number
  day_bonus_end: number
  day_bonus_rate: number
  tiers: TopupCampaignTier[]
  whitelist_user_ids: number[]
}

/**
 * Parses the `periods` option value. Returns null when the option carries no
 * usable period, so callers can fall back to the legacy single-period fields.
 */
export function parsePeriodSetting(
  value: string
): TopupCampaignPeriodSetting[] | null {
  if (!value.trim()) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null
  return parsed.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const start = Number(record.start_time)
    const end = Number(record.end_time)
    const campaignKey = String(record.campaign_key ?? '').trim()
    if (!campaignKey || !Number.isFinite(start) || !Number.isFinite(end)) {
      return []
    }
    return [
      {
        campaign_key: campaignKey,
        start_time: start,
        end_time: end,
        day_bonus_start: Number(record.day_bonus_start ?? 0),
        day_bonus_end: Number(record.day_bonus_end ?? 0),
        day_bonus_rate: Number(record.day_bonus_rate ?? 0),
        tiers: parseTierSetting(JSON.stringify(record.tiers ?? [])),
        whitelist_user_ids: parseWhitelistUserIds(record.whitelist_user_ids),
      },
    ]
  })
}

export function parseWhitelistUserIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const userIds = new Set<number>()
  for (const item of value) {
    const userId = Number(item)
    if (Number.isSafeInteger(userId) && userId > 0) {
      userIds.add(userId)
    }
  }
  return [...userIds].sort((a, b) => a - b)
}

/**
 * The pre-multi-period shape still stored on older installations: one period
 * spread across the flat `topup_campaign_setting.*` options.
 */
export interface TopupCampaignLegacySetting {
  periods?: string
  campaignKey?: string
  startTime?: number
  endTime?: number
  dayBonusStart?: number
  dayBonusEnd?: number
  dayBonusRate?: number
  tiers?: string
}

/**
 * Resolves the period list the admin form edits. When the `periods` option
 * carries periods they win; otherwise the legacy flat options describe the one
 * configured period, so an upgrade does not silently drop it.
 */
export function resolveCampaignPeriods(
  settings: TopupCampaignLegacySetting
): TopupCampaignPeriodSetting[] {
  const configured = parsePeriodSetting(settings.periods ?? '')
  if (configured && configured.length > 0) return configured
  return [
    {
      campaign_key: settings.campaignKey?.trim() || '',
      start_time: settings.startTime ?? 0,
      end_time: settings.endTime ?? 0,
      day_bonus_start: settings.dayBonusStart ?? 0,
      day_bonus_end: settings.dayBonusEnd ?? 0,
      day_bonus_rate: settings.dayBonusRate ?? 0,
      tiers: parseTierSetting(settings.tiers ?? ''),
      whitelist_user_ids: [],
    },
  ]
}

export function serializePeriodSetting(
  periods: TopupCampaignPeriodSetting[]
): string {
  return JSON.stringify(
    periods.map((period) => ({
      campaign_key: period.campaign_key,
      start_time: period.start_time,
      end_time: period.end_time,
      day_bonus_start: period.day_bonus_start,
      day_bonus_end: period.day_bonus_end,
      day_bonus_rate: period.day_bonus_rate,
      tiers: period.tiers.map((tier) => ({
        min_amount: tier.min_amount,
        bonus_amount: tier.bonus_amount,
      })),
      whitelist_user_ids: period.whitelist_user_ids,
    }))
  )
}

export function serializeTierSetting(tiers: TopupCampaignTier[]): string {
  return JSON.stringify(
    tiers.map((tier) => ({
      min_amount: tier.min_amount,
      bonus_amount: tier.bonus_amount,
    }))
  )
}
