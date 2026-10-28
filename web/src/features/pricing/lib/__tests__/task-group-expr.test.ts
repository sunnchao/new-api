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

import type { BillingUsageSchema } from '../../types'
import { parseTaskTiersFromExpr } from '../billing-expr'
import {
  createDefaultTaskMatrixConfig,
  generateTaskExprFromConfig,
  taskMatrixToTiers,
} from '../task-expr'
import {
  generateTaskGroupPricingExpr,
  parseTaskGroupPricingConfig,
  type TaskGroupPricingConfig,
  type TaskGroupPricingRow,
} from '../task-group-expr'

const schema: BillingUsageSchema = {
  image_count: { type: 'number', unit: 'count' },
  input_images: { type: 'number', unit: 'count' },
  resolution: { enum: ['1k', '2k'] },
  quality: { enum: ['low', 'medium'] },
}

function baseRows() {
  return createDefaultTaskMatrixConfig(schema).rows.map((row, index) => ({
    ...row,
    unitPrices: {
      image_count: 0.02 + index * 0.01,
      input_images: 0.01,
    },
  }))
}

function groupRows(multipliers: number[]): TaskGroupPricingRow[] {
  return baseRows().map((row, index) => ({
    ...row,
    multiplier: multipliers[index],
  }))
}

function priceGroup(): TaskGroupPricingConfig {
  return {
    base: { rows: baseRows() },
    groups: {
      vip: {
        mode: 'price',
        rows: baseRows().map((row, index) => ({
          ...row,
          multiplier: 1,
          constant: 0,
          unitPrices: {
            image_count: 0.01 + index * 0.005,
            input_images: 0.008,
          },
        })),
      },
    },
  }
}

describe('task group pricing expression', () => {
  test('round-trips absolute group prices', () => {
    const config = priceGroup()
    const expression = generateTaskGroupPricingExpr(config, schema)
    expect(expression).toContain('group() == "vip"')

    const parsed = parseTaskGroupPricingConfig(expression, schema)
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(parsed.groups.vip.mode).toBe('price')
    expect(parsed.groups.vip.rows[0].unitPrices).toEqual({
      image_count: 0.01,
      input_images: 0.008,
    })
    expect(parsed.base.rows[0].unitPrices.image_count).toBe(0.02)
  })

  test('round-trips per-row multipliers and keeps base prices for editing', () => {
    const multipliers = baseRows().map((_, index) => 0.8 + index * 0.01)
    const config: TaskGroupPricingConfig = {
      base: { rows: baseRows() },
      groups: {
        vip: { mode: 'multiplier', rows: groupRows(multipliers) },
      },
    }
    const expression = generateTaskGroupPricingExpr(config, schema)
    expect(expression).toContain('×0.8 · vip·')

    const parsed = parseTaskGroupPricingConfig(expression, schema)
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(parsed.groups.vip.mode).toBe('multiplier')
    expect(parsed.groups.vip.rows.map((row) => row.multiplier)).toEqual(
      multipliers.map((value) => Number(value.toFixed(12)))
    )
    expect(parsed.groups.vip.rows[0].unitPrices.image_count).toBe(0.02)
  })

  test('parses a base-only expression with no group overrides', () => {
    const expression = generateTaskExprFromConfig(
      { tiers: taskMatrixToTiers({ rows: baseRows() }, schema) },
      schema
    )
    const parsed = parseTaskGroupPricingConfig(expression, schema)
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(parsed.groups).toEqual({})
    expect(parsed.base.rows).toHaveLength(baseRows().length)
  })

  test('resolves group branches for task price display', () => {
    const expression =
      'group() == "vip" ? tier("vip", u("image_count") * 0.05) : tier("base", u("image_count") * 0.1)'
    expect(
      parseTaskTiersFromExpr(expression, schema, false, 'vip').map(
        (tier) => tier.label
      )
    ).toEqual(['vip'])
    expect(
      parseTaskTiersFromExpr(expression, schema, false, 'default').map(
        (tier) => tier.label
      )
    ).toEqual(['base'])
  })

  test('keeps unsupported group branches in raw mode', () => {
    const expression =
      'group() == "vip" ? u("image_count") * 1 : u("image_count") * 2'
    expect(parseTaskGroupPricingConfig(expression, schema)).toBeNull()
  })
})
