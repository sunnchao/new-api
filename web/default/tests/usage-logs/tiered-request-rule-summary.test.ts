import { expect, test } from 'bun:test'
import {
  MATCH_EQ,
  REQUEST_RULE_ACTION_FIXED,
  SOURCE_TOKEN_GROUP,
  buildRequestRuleExpr,
  combineBillingExpr,
  type RequestRuleGroup,
} from '../../src/features/pricing/lib/billing-expr'
import { getMatchedFixedRequestRule } from '../../src/features/usage-logs/lib/format'
import type { LogOtherData } from '../../src/features/usage-logs/types'

function encodeBillingExpr(expr: string): string {
  return Buffer.from(expr, 'utf8').toString('base64')
}

test('resolves fixed request pricing rule from request_fixed matched tier', () => {
  const groups: RequestRuleGroup[] = [
    {
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
      fixedPrice: '0.08',
    },
  ]
  const billingExpr = combineBillingExpr(
    'tier("base", p * 5 + c * 30 + cr * 0.5)',
    buildRequestRuleExpr(groups)
  )
  const other: LogOtherData = {
    billing_mode: 'tiered_expr',
    expr_b64: encodeBillingExpr(billingExpr),
    matched_tier: 'request_fixed_1',
  }

  const summary = getMatchedFixedRequestRule(other)

  expect(summary?.ruleNumber).toBe(1)
  expect(summary?.fixedPrice).toBe(0.08)
  expect(summary?.group.conditions[0]).toMatchObject({
    source: SOURCE_TOKEN_GROUP,
    mode: MATCH_EQ,
    value: 'token_plan',
  })
})
