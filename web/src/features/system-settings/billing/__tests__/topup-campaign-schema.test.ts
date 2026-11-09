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
import { describe, expect, it } from 'vitest'

import {
  campaignPeriodsOverlap,
  sortCampaignPeriodsNewestFirst,
} from '../topup-campaign-form'
import { createTopupCampaignSchema } from '../topup-campaign-schema'

const schema = createTopupCampaignSchema((key) => key)

function period(overrides: Record<string, unknown> = {}) {
  return {
    campaignKey: 'november',
    start: '2026-11-01T00:00',
    end: '2026-11-30T23:59',
    dayStart: '',
    dayEnd: '',
    dayBonusRatePercent: 0,
    tiers: [{ min_amount: 100, bonus_amount: 10 }],
    whitelistUserIds: '',
    ...overrides,
  }
}

function parse(periods: unknown[]) {
  return schema.safeParse({ enabled: true, periods })
}

function firstMessage(periods: unknown[]) {
  const result = parse(periods)
  expect(result.success).toBe(false)
  if (result.success) throw new Error('Expected validation to fail')
  return result.error.issues.map((issue) => issue.message)
}

describe('top-up campaign period schema', () => {
  it('accepts two non-overlapping periods with separate tiers', () => {
    const result = parse([
      period(),
      period({
        campaignKey: 'december',
        start: '2026-12-01T00:00',
        end: '2026-12-31T23:59',
        dayStart: '2026-12-25T00:00',
        dayEnd: '2026-12-25T23:59',
        dayBonusRatePercent: 5,
        tiers: [
          { min_amount: 100, bonus_amount: 10 },
          { min_amount: 300, bonus_amount: 40 },
        ],
      }),
    ])
    expect(result.success).toBe(true)
  })

  it('accepts tiers whose bonuses are independent of each other', () => {
    const result = parse([
      period({
        tiers: [
          { min_amount: 100, bonus_amount: 10 },
          { min_amount: 200, bonus_amount: 20 },
          { min_amount: 400, bonus_amount: 10 },
        ],
      }),
    ])
    expect(result.success).toBe(true)
  })

  it('rejects tiers whose minimum amounts are not increasing', () => {
    expect(
      firstMessage([
        period({
          tiers: [
            { min_amount: 200, bonus_amount: 10 },
            { min_amount: 100, bonus_amount: 20 },
          ],
        }),
      ])
    ).toContain('Tiers must be ordered by minimum amount.')
  })

  it('rejects overlapping campaign windows', () => {
    expect(
      firstMessage([
        period(),
        period({
          campaignKey: 'december',
          start: '2026-11-30T23:59',
          end: '2026-12-31T23:59',
        }),
      ])
    ).toContain('Campaign periods cannot overlap')
  })

  it('rejects duplicate campaign keys', () => {
    expect(
      firstMessage([
        period(),
        period({ start: '2026-12-01T00:00', end: '2026-12-31T23:59' }),
      ])
    ).toContain('Campaign keys must be unique across periods')
  })

  it('rejects a bonus day outside its own period', () => {
    expect(
      firstMessage([
        period({
          dayStart: '2026-10-31T00:00',
          dayEnd: '2026-11-01T01:00',
          dayBonusRatePercent: 5,
        }),
      ])
    ).toContain('Bonus day must be within the campaign period')
  })

  it('rejects a period with no tiers', () => {
    expect(firstMessage([period({ tiers: [] })])).toContain(
      'Enter at least one tier'
    )
  })

  it('rejects an invalid start date', () => {
    expect(firstMessage([period({ start: '' })])).toContain('Invalid date')
  })

  it('accepts a comma-separated whitelist and deduplicates it', () => {
    const result = parse([period({ whitelistUserIds: '1002, 1001 1002' })])
    expect(result.success).toBe(true)
  })

  it('rejects non-numeric whitelist entries', () => {
    expect(firstMessage([period({ whitelistUserIds: '1001, abc' })])).toContain(
      'Enter valid numeric user IDs separated by commas'
    )
  })
})

describe('top-up campaign ordering and overlap', () => {
  it('sorts campaigns by newest start time first', () => {
    const older = period({
      campaignKey: 'older',
      start: '2026-11-01T00:00',
      end: '2026-11-30T23:59',
    })
    const newer = period({
      campaignKey: 'newer',
      start: '2026-12-01T00:00',
      end: '2026-12-31T23:59',
    })

    expect(
      sortCampaignPeriodsNewestFirst([older, newer]).map(
        (campaign) => campaign.campaignKey
      )
    ).toEqual(['newer', 'older'])
  })

  it('treats shared boundaries and contained windows as overlaps', () => {
    const november = period({
      start: '2026-11-01T00:00',
      end: '2026-11-30T23:59',
    })

    expect(
      campaignPeriodsOverlap(november, {
        ...period(),
        start: '2026-11-30T23:59',
        end: '2026-12-31T23:59',
      })
    ).toBe(true)
    expect(
      campaignPeriodsOverlap(november, {
        ...period(),
        start: '2026-11-10T00:00',
        end: '2026-11-20T23:59',
      })
    ).toBe(true)
    expect(
      campaignPeriodsOverlap(november, {
        ...period(),
        start: '2026-12-01T00:00',
        end: '2026-12-31T23:59',
      })
    ).toBe(false)
  })
})
