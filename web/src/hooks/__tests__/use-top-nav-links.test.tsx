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
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { TopupCampaignInfo } from '@/features/topup-campaign/types'

import { useTopNavLinks } from '../use-top-nav-links'

const campaignState = vi.hoisted(() => ({ data: undefined as unknown }))

vi.mock('@/features/topup-campaign/hooks/use-topup-campaign', () => ({
  useTopupCampaign: () => ({ data: campaignState.data }),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: {} }),
}))

const campaignHref = '/activities/double11'

function campaignInfo(
  overrides: Partial<TopupCampaignInfo> = {}
): TopupCampaignInfo {
  return {
    enabled: true,
    campaign_key: 'double11-2026',
    start_time: 1793894400,
    end_time: 1794412799,
    day_bonus_start: 1794326400,
    day_bonus_end: 1794412799,
    day_bonus_rate: 0.05,
    tiers: [{ min_amount: 100, bonus_amount: 10 }],
    status: 'live',
    server_time: 1794000000,
    ...overrides,
  }
}

describe('useTopNavLinks campaign entry', () => {
  it('adds the activity entry while the campaign is running', () => {
    campaignState.data = campaignInfo()

    const { result } = renderHook(() => useTopNavLinks())

    const campaignEntry = result.current.find(
      (link) => link.href === campaignHref
    )
    expect(campaignEntry).toMatchObject({ variant: 'promotion' })
    expect(
      result.current
        .filter((link) => link.href !== campaignHref)
        .every((link) => link.variant === undefined)
    ).toBe(true)
  })

  it('omits the activity entry when the campaign is disabled or ended', () => {
    const hiddenCampaigns = [
      campaignInfo({ enabled: false }),
      campaignInfo({ status: 'disabled' }),
      campaignInfo({ status: 'ended' }),
      undefined,
    ]

    for (const campaign of hiddenCampaigns) {
      campaignState.data = campaign

      const { result } = renderHook(() => useTopNavLinks())

      expect(result.current.some((link) => link.href === campaignHref)).toBe(
        false
      )
    }
  })
})
