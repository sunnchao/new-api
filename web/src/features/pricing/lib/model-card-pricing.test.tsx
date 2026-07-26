import assert from 'node:assert/strict'
import { before, describe, test } from 'node:test'

import i18n from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { initReactI18next } from 'react-i18next'

import { ModelCard } from '../components/model-card'
import type { PricingModel } from '../types'
import { buildRequestRuleExpr, combineBillingExpr } from './billing-expr'

const tokenGroupFixedRequestRules = buildRequestRuleExpr([
  {
    conditions: [
      {
        source: 'token_group',
        path: '',
        mode: 'eq',
        value: 'vip',
      },
    ],
    actionType: 'fixed',
    multiplier: '',
    fixedPrice: '0.2',
  },
])

before(async () => {
  if (i18n.isInitialized) return

  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  })
})

function createTieredModel(): PricingModel {
  return {
    id: 1,
    model_name: 'glm-test',
    description: 'A test pricing model',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['default', 'vip'],
    group_ratio: { default: 1, vip: 0.25 },
    billing_mode: 'tiered_expr',
    billing_expr: combineBillingExpr(
      'tier("base", p * 6 + c * 24)',
      tokenGroupFixedRequestRules
    ),
  }
}

describe('model card pricing', () => {
  test('shows fixed per-request price when the selected group resolves a tiered model to request billing', () => {
    const html = renderToStaticMarkup(
      <ModelCard
        model={createTieredModel()}
        selectedGroup='vip'
        onClick={() => undefined}
      />
    )

    assert.match(html, /\$0\.05/)
    assert.match(html, /request/)
    assert.doesNotMatch(html, /Input/)
    assert.doesNotMatch(html, /Output/)
  })
})
