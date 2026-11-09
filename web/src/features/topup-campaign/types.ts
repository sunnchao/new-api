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
export type TopupCampaignStatus =
  | 'disabled'
  | 'upcoming'
  | 'live'
  | 'day'
  | 'ended'

export interface TopupCampaignTier {
  min_amount: number
  bonus_amount: number
}

export interface TopupCampaignSelf {
  cumulative_amount: number
  tier_bonus_granted: number
  day_bonus_granted: number
  current_tier_index: number
  next_tier_amount?: number
  next_tier_bonus?: number
  gap_to_next?: number
  top_reached: boolean
}

export interface TopupCampaignInfo {
  enabled: boolean
  campaign_key: string
  start_time: number
  end_time: number
  day_bonus_start: number
  day_bonus_end: number
  day_bonus_rate: number
  tiers: TopupCampaignTier[]
  status: TopupCampaignStatus
  server_time: number
  self?: TopupCampaignSelf
}

export interface TopupCampaignResponse {
  success: boolean
  message?: string
  data?: TopupCampaignInfo
}
