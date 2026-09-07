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
  imageSpecPriceToRows,
  parseImageSpecPriceMap,
  parseImageSpecPriceRows,
  upsertModelImageSpecPrices,
} from '../image-spec-price'

describe('image spec price visual editing', () => {
  test('parses a model map and skips invalid nested values', () => {
    const parsed = parseImageSpecPriceMap(
      JSON.stringify({
        'grok-imagine-image-2.0': {
          '2k/medium': 0.07,
          '1k/low': 0.02,
          invalid: -1,
          empty: '',
        },
        ignored: 0.04,
      })
    )

    expect(parsed).toEqual({
      'grok-imagine-image-2.0': {
        '2k/medium': 0.07,
        '1k/low': 0.02,
      },
    })
  })

  test('normalizes visual rows into lowercase lookup keys', () => {
    const result = parseImageSpecPriceRows([
      { id: 1, key: ' 2K/Medium ', price: '0.07' },
      { id: 2, key: '2k', price: '0.06' },
      { id: 3, key: '', price: '' },
    ])

    expect(result).toEqual({
      ok: true,
      specs: {
        '2k/medium': 0.07,
        '2k': 0.06,
      },
    })
  })

  test('rejects empty keys, duplicates, and negative prices', () => {
    expect(
      parseImageSpecPriceRows([{ id: 1, key: '   ', price: '0.02' }])
    ).toEqual({ ok: false, messageKey: 'Spec key is required' })

    expect(
      parseImageSpecPriceRows([
        { id: 1, key: '2k/medium', price: '0.07' },
        { id: 2, key: '2K/Medium', price: '0.08' },
      ])
    ).toEqual({ ok: false, messageKey: 'Duplicate spec key' })

    expect(
      parseImageSpecPriceRows([{ id: 1, key: '2k', price: '-0.01' }])
    ).toEqual({
      ok: false,
      messageKey: 'Image spec price must be finite and non-negative',
    })
    expect(
      parseImageSpecPriceRows([{ id: 1, key: '2k', price: '' }])
    ).toEqual({
      ok: false,
      messageKey: 'Image spec price must be finite and non-negative',
    })
  })

  test('upserts one model without wiping other models, and deletes empty specs', () => {
    const current = JSON.stringify({
      'grok-imagine-image-2.0': { '2k/medium': 0.07, '1k/low': 0.02 },
      'other-image': { '1k': 0.03 },
    })

    const updated = upsertModelImageSpecPrices(
      current,
      ['grok-imagine-image-2.0'],
      { '2k/medium': 0.08 }
    )
    expect(JSON.parse(updated)).toEqual({
      'grok-imagine-image-2.0': { '2k/medium': 0.08 },
      'other-image': { '1k': 0.03 },
    })

    const cleared = upsertModelImageSpecPrices(updated, [
      'grok-imagine-image-2.0',
    ])
    expect(JSON.parse(cleared)).toEqual({
      'other-image': { '1k': 0.03 },
    })
  })

  test('copies specs onto selected models and converts rows for the editor', () => {
    const copied = upsertModelImageSpecPrices(
      '{}',
      ['model-a', 'model-b'],
      { '2k/medium': 0.07 }
    )
    expect(JSON.parse(copied)).toEqual({
      'model-a': { '2k/medium': 0.07 },
      'model-b': { '2k/medium': 0.07 },
    })
    expect(imageSpecPriceToRows({ '2k/medium': 0.07, '1k/low': 0.02 })).toEqual([
      { id: 1, key: '2k/medium', price: '0.07' },
      { id: 2, key: '1k/low', price: '0.02' },
    ])
  })
})
