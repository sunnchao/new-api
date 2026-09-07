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
import { describe, expect, test } from 'vitest'

import {
  buildModelSnapshots,
  getPriceDetail,
  getPriceSummary,
  isBasePricingUnset,
} from '../model-pricing-snapshots'

const emptyMaps = {
  modelRatio: '{}',
  cacheRatio: '{}',
  createCacheRatio: '{}',
  completionRatio: '{}',
  imageRatio: '{}',
  audioRatio: '{}',
  audioCompletionRatio: '{}',
  billingMode: '{}',
  billingExpr: '{}',
}

describe('image spec price snapshots', () => {
  test('treats models with image spec prices as per-request and not unset', () => {
    const [row] = buildModelSnapshots({
      ...emptyMaps,
      modelPrice: JSON.stringify({ 'grok-imagine-image-2.0': 0.02 }),
      imageSpecPrice: JSON.stringify({
        'grok-imagine-image-2.0': { '2k/medium': 0.07, '1k/low': 0.02 },
      }),
    })

    expect(row.billingMode).toBe('per-request')
    expect(row.imageSpecPrices).toEqual({
      '2k/medium': 0.07,
      '1k/low': 0.02,
    })
    expect(isBasePricingUnset(row)).toBe(false)
    expect(getPriceSummary(row, (key) => key)).toBe(
      '$0.02 / request · 2 image specs'
    )
    expect(getPriceDetail(row, (key) => key)).toBe(
      'Includes resolution/quality prices'
    )
  })

  test('keeps models that only have image spec prices in the visual table', () => {
    const [row] = buildModelSnapshots({
      ...emptyMaps,
      modelPrice: '{}',
      imageSpecPrice: JSON.stringify({
        'grok-imagine-image-2.0': { '2k/medium': 0.07 },
      }),
    })

    expect(row.name).toBe('grok-imagine-image-2.0')
    expect(row.billingMode).toBe('per-request')
    expect(isBasePricingUnset(row)).toBe(false)
    expect(getPriceSummary(row, (key) => key)).toBe('1 image specs')
  })
})
