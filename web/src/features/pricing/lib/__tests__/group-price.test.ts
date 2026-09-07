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

import { QUOTA_TYPE_VALUES } from '../../constants'
import type { PricingModel } from '../../types'
import {
  getDefaultRequestPriceDisplay,
  getGroupPriceDisplay,
} from '../group-price'
import { formatRequestUsdPrice } from '../price'

function requestModel(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'grok-imagine-image-2.0',
    quota_type: QUOTA_TYPE_VALUES.REQUEST,
    model_ratio: 1,
    completion_ratio: 1,
    model_price: 0.02,
    enable_groups: ['default', 'vip'],
    group_ratio: { default: 1, vip: 0.5 },
    ...overrides,
  }
}

describe('request price items', () => {
  test('keeps a single fallback row when no image specs are configured', () => {
    const display = getDefaultRequestPriceDisplay({
      model: requestModel(),
      tokenUnit: 'M',
    })

    expect(display?.items).toEqual([
      {
        key: 'fixed',
        labelKey: 'Model Price',
        value: formatRequestUsdPrice(0.02, '', false, 1, 1, {}),
        suffixKey: 'per request',
      },
    ])
  })

  test('appends sorted image spec rows after the fallback price', () => {
    const display = getDefaultRequestPriceDisplay({
      model: requestModel({
        image_spec_price: { '2k': 0.06, '1k/high': 0.08 },
      }),
      tokenUnit: 'M',
    })

    expect(display?.items.map((item) => item.key)).toEqual([
      'fixed',
      'spec:1k/high',
      'spec:2k',
    ])
    expect(display?.items[1]).toMatchObject({
      labelKey: '1k/high',
      suffixKey: 'per image',
      value: formatRequestUsdPrice(0.08, '', false, 1, 1, {}),
    })
    expect(display?.items[2]).toMatchObject({
      labelKey: '2k',
      suffixKey: 'per image',
      value: formatRequestUsdPrice(0.06, '', false, 1, 1, {}),
    })
  })

  test('applies the group ratio to fallback and spec prices', () => {
    const display = getGroupPriceDisplay({
      model: requestModel({
        image_spec_price: { '1k/high': 0.08 },
      }),
      group: 'vip',
      groupRatio: { vip: 0.5 },
      tokenUnit: 'M',
    })

    expect(display.items[0]?.value).toBe(
      formatRequestUsdPrice(0.02, 'vip', false, 1, 1, { vip: 0.5 })
    )
    expect(display.items[1]).toMatchObject({
      key: 'spec:1k/high',
      value: formatRequestUsdPrice(0.08, 'vip', false, 1, 1, { vip: 0.5 }),
    })
  })
})
