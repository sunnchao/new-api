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
  formatUtc8DateTimeInput,
  parsePeriodSetting,
  parseTierSetting,
  parseUtc8DateTimeInput,
  parseWhitelistUserIds,
  resolveCampaignPeriods,
  serializePeriodSetting,
  serializeTierSetting,
} from '../lib/settings'

describe('UTC+8 datetime input helpers', () => {
  test('formats Unix seconds in the campaign timezone', () => {
    assert.equal(formatUtc8DateTimeInput(1793894400), '2026-11-06T00:00')
    assert.equal(formatUtc8DateTimeInput(1794412799), '2026-11-11T23:59')
  })

  test('parses a datetime-local value as UTC+8', () => {
    assert.equal(parseUtc8DateTimeInput('2026-11-06T00:00'), 1793894400)
    assert.equal(parseUtc8DateTimeInput('2026-11-11T23:59:59'), 1794412799)
  })

  test('rejects malformed and impossible dates', () => {
    assert.equal(parseUtc8DateTimeInput(''), null)
    assert.equal(parseUtc8DateTimeInput('not a date'), null)
    assert.equal(parseUtc8DateTimeInput('2026-02-30T00:00'), null)
  })

  test('returns an empty string for missing timestamps', () => {
    assert.equal(formatUtc8DateTimeInput(0), '')
    assert.equal(formatUtc8DateTimeInput(Number.NaN), '')
  })
})

describe('tier option helpers', () => {
  test('parses and sorts the persisted tier array', () => {
    assert.deepEqual(
      parseTierSetting(
        '[{"min_amount":300,"bonus_amount":40},{"min_amount":100,"bonus_amount":10}]'
      ),
      [
        { min_amount: 100, bonus_amount: 10 },
        { min_amount: 300, bonus_amount: 40 },
      ]
    )
  })

  test('drops malformed entries and falls back to an empty list', () => {
    assert.deepEqual(parseTierSetting('{invalid'), [])
    assert.deepEqual(parseTierSetting('{"min_amount":100}'), [])
    assert.deepEqual(
      parseTierSetting(
        '[{"min_amount":0,"bonus_amount":10},{"min_amount":100,"bonus_amount":-1},{"min_amount":200,"bonus_amount":20}]'
      ),
      [{ min_amount: 200, bonus_amount: 20 }]
    )
  })

  test('serializes tiers in the shape the backend validates', () => {
    const value = serializeTierSetting([
      { min_amount: 100, bonus_amount: 10 },
      { min_amount: 2026, bonus_amount: 520 },
    ])
    assert.equal(
      value,
      '[{"min_amount":100,"bonus_amount":10},{"min_amount":2026,"bonus_amount":520}]'
    )
    assert.deepEqual(parseTierSetting(value), [
      { min_amount: 100, bonus_amount: 10 },
      { min_amount: 2026, bonus_amount: 520 },
    ])
  })
})

describe('period option helpers', () => {
  const periods = [
    {
      campaign_key: 'november',
      start_time: 1793894400,
      end_time: 1794412799,
      day_bonus_start: 1794326400,
      day_bonus_end: 1794412799,
      day_bonus_rate: 0.05,
      tiers: [{ min_amount: 100, bonus_amount: 10 }],
      whitelist_user_ids: [1001, 1002],
    },
    {
      campaign_key: 'december',
      start_time: 1795363200,
      end_time: 1795881599,
      day_bonus_start: 0,
      day_bonus_end: 0,
      day_bonus_rate: 0,
      tiers: [],
      whitelist_user_ids: [],
    },
  ]

  test('round-trips the periods option value', () => {
    const value = serializePeriodSetting(periods)
    assert.deepEqual(parsePeriodSetting(value), periods)
  })

  test('ignores periods without a usable key or window', () => {
    assert.deepEqual(parsePeriodSetting(''), null)
    assert.deepEqual(parsePeriodSetting('[]'), null)
    assert.deepEqual(parsePeriodSetting('{invalid'), null)
    assert.deepEqual(parsePeriodSetting('[{"campaign_key":""}]'), [])
  })

  test('falls back to the legacy single-period fields', () => {
    assert.deepEqual(
      resolveCampaignPeriods({
        periods: '[]',
        campaignKey: 'legacy',
        startTime: 1793894400,
        endTime: 1794412799,
        dayBonusStart: 0,
        dayBonusEnd: 0,
        dayBonusRate: 0.05,
        tiers: '[{"min_amount":100,"bonus_amount":10}]',
      }),
      [
        {
          campaign_key: 'legacy',
          start_time: 1793894400,
          end_time: 1794412799,
          day_bonus_start: 0,
          day_bonus_end: 0,
          day_bonus_rate: 0.05,
          tiers: [{ min_amount: 100, bonus_amount: 10 }],
          whitelist_user_ids: [],
        },
      ]
    )
  })

  test('prefers configured periods over the legacy fields', () => {
    assert.deepEqual(
      resolveCampaignPeriods({
        periods: serializePeriodSetting(periods),
        campaignKey: 'legacy',
      }),
      periods
    )
  })

  test('normalizes whitelist user IDs and drops invalid values', () => {
    assert.deepEqual(
      parseWhitelistUserIds([1002, '1001', 0, -1, 1.5]),
      [1001, 1002]
    )
    assert.deepEqual(parseWhitelistUserIds('1001,1002'), [])
  })
})
