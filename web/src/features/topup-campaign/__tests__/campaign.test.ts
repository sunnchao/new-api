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
import assert from 'node:assert/strict'

import { describe, test } from 'vitest'

import {
  countdownTarget,
  isCampaignVisible,
  maxTierBonus,
  splitCountdown,
  tierProgressPercent,
} from '../lib/campaign'
import type { TopupCampaignInfo } from '../types'

const tiers = [
  { min_amount: 100, bonus_amount: 10 },
  { min_amount: 300, bonus_amount: 40 },
  { min_amount: 500, bonus_amount: 80 },
]

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
    tiers,
    status: 'live',
    server_time: 1794000000,
    ...overrides,
  }
}

describe('campaign countdown', () => {
  test('splits remaining milliseconds into days, hours, minutes and seconds', () => {
    const remaining = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000
    assert.deepEqual(splitCountdown(remaining), {
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      expired: false,
    })
  })

  test('reports expired for zero, negative and non-finite input', () => {
    for (const value of [0, -1000, Number.NaN]) {
      assert.equal(splitCountdown(value).expired, true)
    }
  })

  test('targets the start before the event and the end once it is live', () => {
    assert.equal(
      countdownTarget(campaignInfo({ status: 'upcoming' })),
      1793894400
    )
    assert.equal(countdownTarget(campaignInfo({ status: 'live' })), 1794412799)
    assert.equal(countdownTarget(campaignInfo({ status: 'day' })), 1794412799)
  })
})

describe('campaign tiers', () => {
  test('sums the independent bonus for every tier', () => {
    assert.equal(maxTierBonus(tiers), 130)
    assert.equal(
      maxTierBonus([
        { min_amount: 100, bonus_amount: 10 },
        { min_amount: 200, bonus_amount: 20 },
        { min_amount: 400, bonus_amount: 10 },
      ]),
      40
    )
    assert.equal(maxTierBonus([]), 0)
  })

  test('measures progress inside the current tier band', () => {
    const beforeFirst = campaignInfo({
      self: {
        cumulative_amount: 50,
        tier_bonus_granted: 0,
        day_bonus_granted: 0,
        current_tier_index: -1,
        top_reached: false,
      },
    })
    assert.equal(tierProgressPercent(beforeFirst), 50)

    const betweenFirstAndSecond = campaignInfo({
      self: {
        cumulative_amount: 200,
        tier_bonus_granted: 10,
        day_bonus_granted: 0,
        current_tier_index: 0,
        top_reached: false,
      },
    })
    assert.equal(tierProgressPercent(betweenFirstAndSecond), 50)

    const top = campaignInfo({
      self: {
        cumulative_amount: 800,
        tier_bonus_granted: 80,
        day_bonus_granted: 0,
        current_tier_index: 2,
        top_reached: true,
      },
    })
    assert.equal(tierProgressPercent(top), 100)
  })
})

describe('campaign visibility', () => {
  test('hides disabled and ended campaigns', () => {
    assert.equal(isCampaignVisible(undefined), false)
    assert.equal(isCampaignVisible(campaignInfo({ enabled: false })), false)
    assert.equal(isCampaignVisible(campaignInfo({ status: 'disabled' })), false)
    assert.equal(isCampaignVisible(campaignInfo({ status: 'ended' })), false)
    assert.equal(isCampaignVisible(campaignInfo()), true)
  })
})
