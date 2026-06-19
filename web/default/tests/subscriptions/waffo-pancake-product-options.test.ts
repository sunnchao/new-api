import { expect, test } from 'bun:test'
import {
  WAFFO_PANCAKE_PRODUCT_NONE_VALUE,
  getWaffoPancakeProductSelectItems,
} from '../../src/features/subscriptions/lib/plan-form'

test('builds a clearable Waffo Pancake product option list', () => {
  const items = getWaffoPancakeProductSelectItems(
    [{ id: 'PROD_basic', name: 'Basic Plan', status: 'published' }],
    'PROD_basic',
    'No Waffo Pancake product'
  )

  expect(items[0]).toEqual({
    value: WAFFO_PANCAKE_PRODUCT_NONE_VALUE,
    label: 'No Waffo Pancake product',
  })
  expect(items).toContainEqual({
    value: 'PROD_basic',
    label: 'Basic Plan (PROD_basic)',
  })
})

test('keeps the saved Waffo Pancake product visible when it is missing from the catalog', () => {
  const items = getWaffoPancakeProductSelectItems(
    [],
    'PROD_archived',
    'No Waffo Pancake product'
  )

  expect(items).toEqual([
    {
      value: WAFFO_PANCAKE_PRODUCT_NONE_VALUE,
      label: 'No Waffo Pancake product',
    },
    { value: 'PROD_archived', label: 'PROD_archived' },
  ])
})
