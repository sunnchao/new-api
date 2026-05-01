import { expect, test } from 'bun:test'
import {
  MATCH_EQ,
  MATCH_LT,
  REQUEST_RULE_ACTION_FIXED,
  REQUEST_RULE_ACTION_MULTIPLIER,
  SOURCE_TIME,
  SOURCE_TOKEN_GROUP,
  buildRequestRuleExpr,
  combineBillingExpr,
  type RequestRuleGroup,
} from '../../src/features/pricing/lib/billing-expr'
import {
  getDefaultRequestPriceDisplay,
  getGroupPriceDisplay,
} from '../../src/features/pricing/lib/group-price'
import type { PricingModel } from '../../src/features/pricing/types'

const baseDynamicModel: PricingModel = {
  id: 1,
  model_name: 'gpt-5.5',
  quota_type: 0,
  model_ratio: 37.5,
  completion_ratio: 6,
  cache_ratio: 0.1,
  enable_groups: ['default', 'vip'],
  billing_mode: 'tiered_expr',
  billing_expr: 'tier("base", p * 5 + c * 30 + cr * 0.5)',
}

test('marks unresolved tiered expressions as dynamic in group pricing', () => {
  const display = getGroupPriceDisplay({
    model: baseDynamicModel,
    group: 'default',
    groupRatio: { default: 1 },
    tokenUnit: 'M',
  })

  expect(display.billingType).toBe('dynamic')
  expect(display.items).toEqual([
    {
      key: 'dynamic',
      labelKey: 'Dynamic Pricing',
      value: '',
      suffixKey: 'See dynamic pricing details above',
      isDynamic: true,
    },
  ])
})

test('resolves token-group fixed request rules for group pricing', () => {
  const requestRuleGroups: RequestRuleGroup[] = [
    {
      conditions: [
        {
          source: SOURCE_TOKEN_GROUP,
          path: '',
          mode: MATCH_EQ,
          value: 'vip',
        },
      ],
      actionType: REQUEST_RULE_ACTION_FIXED,
      multiplier: '',
      fixedPrice: '0.2',
    },
  ]
  const model: PricingModel = {
    ...baseDynamicModel,
    billing_expr: combineBillingExpr(
      baseDynamicModel.billing_expr || '',
      buildRequestRuleExpr(requestRuleGroups)
    ),
  }

  const display = getGroupPriceDisplay({
    model,
    group: 'vip',
    groupRatio: { vip: 2 },
    tokenUnit: 'M',
  })

  expect(display.billingType).toBe('request')
  expect(display.items).toEqual([
    {
      key: 'fixed',
      labelKey: 'Model Price',
      value: '$0.4',
      suffixKey: 'per request',
    },
  ])
})

const deepseekFlashRequestRules: RequestRuleGroup[] = [
  {
    conditions: [
      {
        source: SOURCE_TIME,
        timeFunc: 'hour',
        timezone: 'Asia/Shanghai',
        mode: MATCH_EQ,
        value: '21',
        rangeStart: '',
        rangeEnd: '',
      },
      {
        source: SOURCE_TIME,
        timeFunc: 'minute',
        timezone: 'Asia/Shanghai',
        mode: MATCH_LT,
        value: '8',
        rangeStart: '',
        rangeEnd: '',
      },
    ],
    actionType: REQUEST_RULE_ACTION_MULTIPLIER,
    multiplier: '11',
    fixedPrice: '',
  },
  {
    conditions: [
      {
        source: SOURCE_TOKEN_GROUP,
        path: '',
        mode: MATCH_EQ,
        value: 'default',
      },
    ],
    actionType: REQUEST_RULE_ACTION_FIXED,
    multiplier: '',
    fixedPrice: '11',
  },
]

const deepseekFlashModel: PricingModel = {
  id: 2,
  model_name: 'deepseek-v4-flash',
  quota_type: 0,
  model_ratio: 0.5,
  completion_ratio: 2,
  cache_ratio: 0.2,
  enable_groups: ['default', 'token_plan'],
  billing_mode: 'tiered_expr',
  billing_expr: combineBillingExpr(
    'tier("base", p * 1 + c * 2 + cr * 0.2)',
    buildRequestRuleExpr(deepseekFlashRequestRules)
  ),
}

test('resolves deepseek fixed token group after unmatched time multiplier', () => {
  const display = getGroupPriceDisplay({
    model: deepseekFlashModel,
    group: 'default',
    groupRatio: { default: 1, token_plan: 1 },
    tokenUnit: 'M',
    now: new Date('2026-04-30T12:00:00+08:00'),
  })

  expect(display.billingType).toBe('request')
  expect(display.items).toEqual([
    {
      key: 'fixed',
      labelKey: 'Model Price',
      value: '$11',
      suffixKey: 'per request',
    },
  ])
})

test('applies matched time multipliers to deepseek fixed token group display', () => {
  const display = getGroupPriceDisplay({
    model: deepseekFlashModel,
    group: 'default',
    groupRatio: { default: 1, token_plan: 1 },
    tokenUnit: 'M',
    now: new Date('2026-04-30T21:05:00+08:00'),
  })

  expect(display.billingType).toBe('request')
  expect(display.items).toEqual([
    {
      key: 'fixed',
      labelKey: 'Model Price',
      value: '$121',
      suffixKey: 'per request',
    },
  ])
})

test('keeps token-plan dynamic when only time multipliers can be resolved', () => {
  const display = getGroupPriceDisplay({
    model: deepseekFlashModel,
    group: 'token_plan',
    groupRatio: { default: 1, token_plan: 1 },
    tokenUnit: 'M',
    now: new Date('2026-04-30T21:05:00+08:00'),
  })

  expect(display.billingType).toBe('dynamic')
  expect(display.items).toEqual([
    {
      key: 'dynamic',
      labelKey: 'Dynamic Pricing',
      value: '',
      suffixKey: 'See dynamic pricing details above',
      isDynamic: true,
    },
  ])
})

test('resolves default group request pricing for marketplace summaries', () => {
  const display = getDefaultRequestPriceDisplay({
    model: deepseekFlashModel,
    groupRatio: { default: 1, token_plan: 1 },
    tokenUnit: 'M',
    now: new Date('2026-04-30T12:00:00+08:00'),
  })

  expect(display?.group).toBe('default')
  expect(display?.billingType).toBe('request')
  expect(display?.items[0].value).toBe('$11')
})
