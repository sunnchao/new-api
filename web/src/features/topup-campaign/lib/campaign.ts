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
import type { TopupCampaignInfo, TopupCampaignTier } from '../types'

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function splitCountdown(remainingMs: number): CountdownParts {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  const totalSeconds = Math.floor(remainingMs / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  }
}

export function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatClock(parts: CountdownParts): string {
  return `${padTwo(parts.hours)}:${padTwo(parts.minutes)}:${padTwo(parts.seconds)}`
}

/** Sum of the independent bonus earned by reaching every configured tier. */
export function maxTierBonus(tiers: TopupCampaignTier[]): number {
  return tiers.reduce((total, tier) => total + tier.bonus_amount, 0)
}

/** The timestamp the hero countdown targets: start before the event, end during it. */
export function countdownTarget(info: TopupCampaignInfo): number {
  if (info.status === 'upcoming') return info.start_time
  return info.end_time
}

/**
 * Share of the current tier band the user has covered, in [0, 100]. The band
 * runs from the last reached tier to the next one; before the first tier it
 * runs from zero to the first threshold.
 */
export function tierProgressPercent(info: TopupCampaignInfo): number {
  const self = info.self
  if (!self || info.tiers.length === 0) return 0
  const currentIndex = self.current_tier_index
  if (currentIndex >= info.tiers.length - 1) return 100
  const lower = currentIndex >= 0 ? info.tiers[currentIndex].min_amount : 0
  const upper = info.tiers[currentIndex + 1].min_amount
  if (upper <= lower) return 100
  const covered = Math.min(
    Math.max(self.cumulative_amount - lower, 0),
    upper - lower
  )
  return Math.round((covered / (upper - lower)) * 100)
}

export function isCampaignVisible(
  info: TopupCampaignInfo | undefined
): info is TopupCampaignInfo {
  return (
    !!info?.enabled && info.status !== 'disabled' && info.status !== 'ended'
  )
}

/** Formats a Unix timestamp in the campaign's reference timezone (UTC+8). */
export function formatCampaignDate(
  unixSeconds: number,
  locale?: string
): string {
  return new Intl.DateTimeFormat(locale ?? 'en', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(unixSeconds * 1000))
}

export function formatCampaignTime(
  unixSeconds: number,
  locale?: string
): string {
  return new Intl.DateTimeFormat(locale ?? 'en', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(unixSeconds * 1000))
}

export function formatBonusRate(rate: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? 'en', {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(rate)
}
