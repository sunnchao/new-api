import { expect, test } from 'bun:test'
import {
  MATCH_EQ,
  REQUEST_RULE_ACTION_FIXED,
  SOURCE_TOKEN_GROUP,
  buildRequestRuleExpr,
  combineBillingExpr,
  type RequestRuleGroup,
} from '../../src/features/pricing/lib/billing-expr'
import {
  formatModelListTokenPrice,
  getModelListPricingContext,
} from '../../src/features/pricing/lib/model-list-price'
import type { PricingModel } from '../../src/features/pricing/types'

const tokenPlanFixedRule: RequestRuleGroup = {
  conditions: [
    {
      source: SOURCE_TOKEN_GROUP,
      path: '',
      mode: MATCH_EQ,
      value: 'token_plan',
    },
  ],
  actionType: REQUEST_RULE_ACTION_FIXED,
  multiplier: '',
  fixedPrice: '0.01',
}

const dynamicTokenPlanModel: PricingModel = {
  id: 1,
  model_name: 'deepseek-v4-flash',
  quota_type: 0,
  model_ratio: 0.5,
  completion_ratio: 2,
  cache_ratio: 0.2,
  enable_groups: ['default', 'token_plan'],
  billing_mode: 'tiered_expr',
  billing_expr: combineBillingExpr(
    'tier("base", p * 1 + c * 2 + cr * 0.2)',
    buildRequestRuleExpr([tokenPlanFixedRule])
  ),
  group_ratio: { default: 1, token_plan: 1 },
}

test('uses selected group fixed request pricing for model list summaries', () => {
  const context = getModelListPricingContext({
    model: dynamicTokenPlanModel,
    groupFilter: 'token_plan',
    tokenUnit: 'M',
  })

  expect(context.selectedGroup).toBe('token_plan')
  expect(context.requestPriceDisplay?.billingType).toBe('request')
  expect(context.requestPriceDisplay?.items[0].value).toBe('$0.01')
})

test('keeps default list pricing when no concrete group is selected', () => {
  const context = getModelListPricingContext({
    model: dynamicTokenPlanModel,
    groupFilter: 'all',
    tokenUnit: 'M',
  })

  expect(context.selectedGroup).toBeNull()
  expect(context.requestPriceDisplay).toBeNull()
  expect(
    context.dynamicSummary?.primaryEntries.map((entry) => entry.formatted)
  ).toEqual(['$1', '$2'])
})

test('formats token prices with the selected group ratio', () => {
  const model: PricingModel = {
    id: 2,
    model_name: 'ratio-model',
    quota_type: 0,
    model_ratio: 0.5,
    completion_ratio: 2,
    cache_ratio: 0.1,
    enable_groups: ['default', 'token_plan'],
    group_ratio: { default: 1, token_plan: 2 },
  }
  const context = getModelListPricingContext({
    model,
    groupFilter: 'token_plan',
    tokenUnit: 'M',
  })

  expect(formatModelListTokenPrice(context, 'input')).toBe('$2')
  expect(formatModelListTokenPrice(context, 'output')).toBe('$4')
  expect(formatModelListTokenPrice(context, 'cache')).toBe('$0.2')
})
