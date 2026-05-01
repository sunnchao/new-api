import { expect, test } from 'bun:test'
import { formatGroupPrice, formatPrice } from '../../src/features/pricing/lib/price'
import type { PricingModel } from '../../src/features/pricing/types'

const dynamicModel: PricingModel = {
  id: 1,
  model_name: 'gpt-5.5',
  quota_type: 0,
  model_ratio: 37.5,
  completion_ratio: 6,
  cache_ratio: 0.1,
  enable_groups: ['token_plan'],
  billing_mode: 'tiered_expr',
  billing_expr: 'tier("base", p * 5 + c * 30 + cr * 0.5)',
}

test('formats tiered expression prices instead of legacy ratio fallback', () => {
  expect(formatPrice(dynamicModel, 'input', 'M')).toBe('$5')
  expect(formatPrice(dynamicModel, 'output', 'M')).toBe('$30')
  expect(formatPrice(dynamicModel, 'cache', 'M')).toBe('$0.5')
})

test('formats tiered expression prices with group ratios', () => {
  const groupRatio = { token_plan: 2 }

  expect(
    formatGroupPrice(dynamicModel, 'token_plan', 'input', 'M', false, 1, 1, groupRatio)
  ).toBe('$10')
  expect(
    formatGroupPrice(dynamicModel, 'token_plan', 'output', 'M', false, 1, 1, groupRatio)
  ).toBe('$60')
})
