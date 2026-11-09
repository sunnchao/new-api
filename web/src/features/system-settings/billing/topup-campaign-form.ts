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
import {
  formatUtc8DateTimeInput,
  parseUtc8DateTimeInput,
  serializePeriodSetting,
  type TopupCampaignPeriodSetting,
} from '@/features/topup-campaign/lib/settings'

import {
  parseWhitelistUserIdsInput,
  type TopupCampaignPeriodFormValues,
} from './topup-campaign-schema'

export function toPeriodFormValues(
  period: TopupCampaignPeriodSetting
): TopupCampaignPeriodFormValues {
  return {
    campaignKey: period.campaign_key,
    start: formatUtc8DateTimeInput(period.start_time),
    end: formatUtc8DateTimeInput(period.end_time),
    dayStart: formatUtc8DateTimeInput(period.day_bonus_start),
    dayEnd: formatUtc8DateTimeInput(period.day_bonus_end),
    dayBonusRatePercent: Number((period.day_bonus_rate * 100).toFixed(2)),
    // Keep one editable row so a period configured without tiers can be fixed.
    tiers:
      period.tiers.length > 0
        ? period.tiers
        : [{ min_amount: 0, bonus_amount: 0 }],
    whitelistUserIds: period.whitelist_user_ids.join(', '),
  }
}

export function toPeriodSetting(
  values: TopupCampaignPeriodFormValues
): TopupCampaignPeriodSetting {
  return {
    campaign_key: values.campaignKey.trim(),
    start_time: parseUtc8DateTimeInput(values.start) ?? 0,
    end_time: parseUtc8DateTimeInput(values.end) ?? 0,
    day_bonus_start: parseUtc8DateTimeInput(values.dayStart) ?? 0,
    day_bonus_end: parseUtc8DateTimeInput(values.dayEnd) ?? 0,
    day_bonus_rate: Number((values.dayBonusRatePercent / 100).toFixed(6)),
    tiers: values.tiers,
    whitelist_user_ids:
      parseWhitelistUserIdsInput(values.whitelistUserIds) ?? [],
  }
}

export function toPeriodsOptionValue(
  periods: TopupCampaignPeriodFormValues[]
): string {
  return serializePeriodSetting(
    sortCampaignPeriodsNewestFirst(periods).map(toPeriodSetting)
  )
}

/** Keeps the newest campaign first in the admin table and persisted JSON. */
export function sortCampaignPeriodsNewestFirst(
  periods: TopupCampaignPeriodFormValues[]
): TopupCampaignPeriodFormValues[] {
  return [...periods].sort((first, second) => {
    const firstStart = parseUtc8DateTimeInput(first.start) ?? 0
    const secondStart = parseUtc8DateTimeInput(second.start) ?? 0
    if (firstStart !== secondStart) return secondStart - firstStart
    return first.campaignKey.localeCompare(second.campaignKey)
  })
}

/** Inclusive overlap check, matching the backend's window validation. */
export function campaignPeriodsOverlap(
  first: TopupCampaignPeriodFormValues,
  second: TopupCampaignPeriodFormValues
): boolean {
  const firstStart = parseUtc8DateTimeInput(first.start)
  const firstEnd = parseUtc8DateTimeInput(first.end)
  const secondStart = parseUtc8DateTimeInput(second.start)
  const secondEnd = parseUtc8DateTimeInput(second.end)
  if (
    firstStart === null ||
    firstEnd === null ||
    secondStart === null ||
    secondEnd === null
  ) {
    return false
  }
  return firstStart <= secondEnd && secondStart <= firstEnd
}

export function newTopupCampaignDraft(
  periods: TopupCampaignPeriodFormValues[]
): TopupCampaignPeriodFormValues {
  const now = Math.floor(Date.now() / 1000)
  const latestEnd = periods.reduce((latest, period) => {
    return Math.max(latest, parseUtc8DateTimeInput(period.end) ?? 0)
  }, 0)
  const start = Math.max(now, latestEnd + 3600)
  const end = start + 7 * 24 * 3600
  const dateKey = formatUtc8DateTimeInput(start)
    .slice(0, 10)
    .replaceAll('-', '')
  const existingKeys = new Set(periods.map((period) => period.campaignKey))
  let campaignKey = `campaign-${dateKey}`
  let suffix = 2
  while (existingKeys.has(campaignKey)) {
    campaignKey = `campaign-${dateKey}-${suffix}`
    suffix += 1
  }
  return {
    campaignKey,
    start: formatUtc8DateTimeInput(start),
    end: formatUtc8DateTimeInput(end),
    dayStart: '',
    dayEnd: '',
    dayBonusRatePercent: 0,
    tiers: [{ min_amount: 100, bonus_amount: 10 }],
    whitelistUserIds: '',
  }
}

export type TopupCampaignDraftStatus = 'upcoming' | 'live' | 'day' | 'ended'

export function topupCampaignDraftStatus(
  period: TopupCampaignPeriodFormValues,
  nowSeconds = Math.floor(Date.now() / 1000)
): TopupCampaignDraftStatus {
  const start = parseUtc8DateTimeInput(period.start)
  const end = parseUtc8DateTimeInput(period.end)
  if (start === null || end === null || end <= start) return 'ended'
  if (nowSeconds < start) return 'upcoming'
  if (nowSeconds > end) return 'ended'
  const dayStart = parseUtc8DateTimeInput(period.dayStart)
  const dayEnd = parseUtc8DateTimeInput(period.dayEnd)
  if (
    period.dayBonusRatePercent > 0 &&
    dayStart !== null &&
    dayEnd !== null &&
    nowSeconds >= dayStart &&
    nowSeconds <= dayEnd
  ) {
    return 'day'
  }
  return 'live'
}
