import { expect, test } from 'bun:test'
import {
  MATCH_CONTAINS,
  MATCH_EQ,
  MATCH_EXISTS,
  REQUEST_RULE_ACTION_FIXED,
  REQUEST_RULE_ACTION_MULTIPLIER,
  SOURCE_TOKEN_GROUP,
  buildRequestRuleExpr,
  combineBillingExpr,
  getRequestRuleMatchOptions,
  normalizeCondition,
  splitBillingExprAndRequestRules,
  tryParseRequestRuleExpr,
  type RequestRuleGroup,
} from '../../src/features/pricing/lib/billing-expr'

test('supports token group request rule conditions', () => {
  expect(SOURCE_TOKEN_GROUP).toBe('token_group')

  const options = getRequestRuleMatchOptions(SOURCE_TOKEN_GROUP).map(
    (option) => option.value
  )
  expect(options).toEqual([MATCH_EQ, MATCH_CONTAINS, MATCH_EXISTS])

  expect(
    normalizeCondition({
      source: SOURCE_TOKEN_GROUP,
      path: 'ignored',
      mode: MATCH_EQ,
      value: 'vip',
    })
  ).toEqual({
    source: SOURCE_TOKEN_GROUP,
    path: '',
    mode: MATCH_EQ,
    value: 'vip',
  })
})

test('serializes token group fixed request rules for backend apply_request_rules', () => {
  const groups: RequestRuleGroup[] = [
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
    {
      conditions: [
        {
          source: 'param',
          path: 'service_tier',
          mode: MATCH_EQ,
          value: 'fast',
        },
      ],
      actionType: REQUEST_RULE_ACTION_MULTIPLIER,
      multiplier: '0.5',
      fixedPrice: '',
    },
  ]

  const requestRuleExpr = buildRequestRuleExpr(groups)
  expect(requestRuleExpr).not.toBe('')

  const combined = combineBillingExpr('tier("base", p * 2)', requestRuleExpr)
  expect(combined).toStartWith('apply_request_rules(')

  const split = splitBillingExprAndRequestRules(combined)
  expect(split.billingExpr).toBe('tier("base", p * 2)')
  expect(split.requestRuleExpr).toBe(requestRuleExpr)
  expect(tryParseRequestRuleExpr(split.requestRuleExpr)).toEqual(groups)
})
