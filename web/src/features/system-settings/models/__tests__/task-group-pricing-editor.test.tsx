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
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { afterEach, expect, it, vi } from 'vitest'

import { createDefaultTaskMatrixConfig } from '@/features/pricing/lib/task-expr'
import { generateTaskGroupPricingExpr } from '@/features/pricing/lib/task-group-expr'
import type { BillingUsageSchema } from '@/features/pricing/types'

import { TaskGroupPricingEditor } from '../task-group-pricing-editor'
import { TaskUsagePricingEditor } from '../task-usage-pricing-editor'

const schema: BillingUsageSchema = {
  image_count: { type: 'number', unit: 'count' },
  input_images: { type: 'number', unit: 'count' },
  resolution: { enum: ['1k', '2k'] },
  quality: { enum: ['low', 'medium'] },
}

const baseRows = createDefaultTaskMatrixConfig(schema).rows

afterEach(async () => {
  await i18next.changeLanguage('en')
})

it('adds a visual group override from the base rows', async () => {
  const onChange = vi.fn()
  render(
    <TaskGroupPricingEditor
      usageSchema={schema}
      baseRows={baseRows}
      groups={{}}
      availableGroups={['vip']}
      onChange={onChange}
    />
  )

  expect(
    screen.queryByRole('textbox', { name: 'Group name' })
  ).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('combobox', { name: 'Add group' }))
  await userEvent.click(screen.getByRole('option', { name: 'vip' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add group' }))

  expect(onChange).toHaveBeenCalledTimes(1)
  const next = onChange.mock.calls[0][0]
  expect(next.vip.mode).toBe('price')
  expect(next.vip.rows).toHaveLength(baseRows.length)
})

it('opens a saved group expression in the visual group editor', () => {
  const expression = generateTaskGroupPricingExpr(
    {
      base: { rows: baseRows },
      groups: {
        vip: {
          mode: 'price',
          rows: baseRows.map((row) => ({ ...row, multiplier: 1 })),
        },
      },
    },
    schema
  )
  render(
    <TaskUsagePricingEditor
      usageSchema={schema}
      billingExpr={expression}
      requestRuleExpr=''
      onBillingExprChange={vi.fn()}
      onRequestRuleExprChange={vi.fn()}
    />
  )

  expect(screen.getByText('Pricing by Group')).toBeVisible()
  expect(screen.getByText('vip')).toBeVisible()
})

it('renders row multipliers for a saved multiplier group', () => {
  const expression = generateTaskGroupPricingExpr(
    {
      base: { rows: baseRows },
      groups: {
        vip: {
          mode: 'multiplier',
          rows: baseRows.map((row) => ({ ...row, multiplier: 0.8 })),
        },
      },
    },
    schema
  )
  render(
    <TaskUsagePricingEditor
      usageSchema={schema}
      billingExpr={expression}
      requestRuleExpr=''
      onBillingExprChange={vi.fn()}
      onRequestRuleExprChange={vi.fn()}
    />
  )

  expect(
    screen.getAllByRole('spinbutton', { name: /vip .* Multiplier/ })
  ).toHaveLength(baseRows.length)
})
