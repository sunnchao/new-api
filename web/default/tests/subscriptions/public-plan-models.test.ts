import { expect, test } from 'bun:test'
import {
  filterModelsByAllowedGroups,
  getSingleGroupPricingSearch,
  parseAllowedGroups,
} from '../../src/features/subscriptions/lib/public-plan-models'
import { getPublicPlanCardAction } from '../../src/features/subscriptions/lib/public-plan-card'
import type { PricingModel } from '../../src/features/pricing/types'

const models = [
  {
    id: 1,
    model_name: 'default-only',
    enable_groups: ['default'],
  },
  {
    id: 2,
    model_name: 'vip-model',
    enable_groups: ['vip', 'team'],
  },
  {
    id: 3,
    model_name: 'enterprise-model',
    enable_groups: ['enterprise'],
  },
  {
    id: 4,
    model_name: 'no-groups',
    enable_groups: [],
  },
] as PricingModel[]

test('parses comma-separated allowed groups with trimming and dedupe', () => {
  expect(parseAllowedGroups(' default, vip, default ,, team ')).toEqual([
    'default',
    'vip',
    'team',
  ])
})

test('filters pricing models that match any allowed group', () => {
  expect(
    filterModelsByAllowedGroups(models, ['vip', 'enterprise']).map(
      (model) => model.model_name
    )
  ).toEqual(['vip-model', 'enterprise-model'])
})

test('only creates a model-square group search for one concrete group', () => {
  expect(getSingleGroupPricingSearch(['vip'])).toEqual({ group: 'vip' })
  expect(getSingleGroupPricingSearch(['vip', 'team'])).toBeNull()
  expect(getSingleGroupPricingSearch([])).toBeNull()
})

test('uses separate anonymous CTAs for home and catalog plan cards', () => {
  expect(getPublicPlanCardAction({ mode: 'home', isAuthenticated: false })).toEqual({
    labelKey: 'Get Started',
    to: '/sign-up',
  })
  expect(
    getPublicPlanCardAction({ mode: 'catalog', isAuthenticated: false })
  ).toEqual({
    labelKey: 'Sign in to subscribe',
    to: '/sign-in',
  })
  expect(getPublicPlanCardAction({ mode: 'home', isAuthenticated: true })).toEqual({
    labelKey: 'Subscribe Now',
    to: '/my-subscriptions',
  })
})
