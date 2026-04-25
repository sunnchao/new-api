import test from 'node:test';
import assert from 'node:assert/strict';

import {
  convertSubscriptionAmountToFormValue,
  convertSubscriptionAmountToStorageValue,
  filterHomepageSubscriptionPlans,
  formatSubscriptionUsageSummary,
  formatSubscriptionAmountValue,
  formatSubscriptionTotalValue,
  formatSubscriptionQuotaLimitSummary,
  getSubscriptionUsageMetrics,
  getSubscriptionQuotaLimitItems,
} from './subscriptionFormat.js';

const t = (value) => value;

test('quota mode converts stored amounts to display amounts for editing', () => {
  assert.equal(
    convertSubscriptionAmountToFormValue(
      750000000,
      'quota',
      (value) => value / 500000,
    ),
    1500,
  );
});

test('request mode keeps raw counts when converting stored amounts to form values', () => {
  assert.equal(
    convertSubscriptionAmountToFormValue(
      1500,
      'request',
      (value) => value / 500000,
    ),
    1500,
  );
});

test('request mode can compat legacy quota-scaled counts when editing old plans', () => {
  assert.equal(
    convertSubscriptionAmountToFormValue(
      750000000,
      'request',
      (value) => value / 500000,
      {
        legacyRequestQuotaCompat: true,
      },
    ),
    1500,
  );
});

test('quota mode converts display amounts back to stored quota values', () => {
  assert.equal(
    convertSubscriptionAmountToStorageValue(
      1500,
      'quota',
      (value) => value * 500000,
    ),
    750000000,
  );
});

test('request mode stores raw counts without quota conversion', () => {
  assert.equal(
    convertSubscriptionAmountToStorageValue(
      1500,
      'request',
      (value) => value * 500000,
    ),
    1500,
  );
});

test('request-based amount formatting uses count units', () => {
  assert.equal(
    formatSubscriptionAmountValue(
      12,
      { billing_mode: 'request' },
      t,
      (value) => `quota:${value}`,
    ),
    '12 次',
  );
});

test('quota-based amount formatting can append approximate request counts', () => {
  assert.equal(
    formatSubscriptionAmountValue(
      750000000,
      { billing_mode: 'quota' },
      t,
      (value) => `${value / 500000} USD`,
      { approximateTimes: 1500 },
    ),
    '1500 USD（约 1500 次）',
  );

  assert.equal(
    formatSubscriptionTotalValue(
      750000000,
      { billing_mode: 'quota' },
      t,
      (value) => `${value / 500000} USD`,
      { approximateTimes: 1500 },
    ),
    '1500 USD（约 1500 次）',
  );
});

test('request-based amount formatting ignores approximate request counts', () => {
  assert.equal(
    formatSubscriptionAmountValue(
      12,
      { billing_mode: 'request' },
      t,
      (value) => `${value} USD`,
      { approximateTimes: 999 },
    ),
    '12 次',
  );

  assert.equal(
    formatSubscriptionTotalValue(
      12,
      { billing_mode: 'request' },
      t,
      (value) => `${value} USD`,
      { approximateTimes: 999 },
    ),
    '12 次',
  );
});

test('request-based limit summary uses count units', () => {
  assert.equal(
    formatSubscriptionQuotaLimitSummary(
      {
        billing_mode: 'request',
        hourly_limit_amount: 12,
        hourly_limit_hours: 5,
      },
      t,
    ),
    '每5小时 12 次 · 锚点',
  );
});

test('quota limit items include approximate request counts', () => {
  assert.deepEqual(
    getSubscriptionQuotaLimitItems(
      {
        billing_mode: 'quota',
        hourly_limit_amount: 10,
        hourly_limit_hours: 3,
        hourly_approximate_times: 20,
        daily_limit_amount: 100,
        daily_approximate_times: 200,
        weekly_limit_amount: 1000,
        weekly_approximate_times: 2000,
        monthly_limit_amount: 10000,
        monthly_approximate_times: 20000,
      },
      t,
    ).map(({ key, approximateTimes }) => ({ key, approximateTimes })),
    [
      { key: 'hourly', approximateTimes: 20 },
      { key: 'daily', approximateTimes: 200 },
      { key: 'weekly', approximateTimes: 2000 },
      { key: 'monthly', approximateTimes: 20000 },
    ],
  );
});

test('quota usage summary uses wallet display units for purchased subscriptions', () => {
  assert.deepEqual(
    formatSubscriptionUsageSummary(
      {
        used: 750000000,
        total: 1500000000,
      },
      { billing_mode: 'quota' },
      t,
      (value) => `${value / 500000} USD`,
    ),
    {
      usedText: '1500 USD',
      totalText: '3000 USD',
      remainText: '1500 USD',
    },
  );
});

test('request usage summary uses request counts for purchased subscriptions', () => {
  assert.deepEqual(
    formatSubscriptionUsageSummary(
      {
        used: 12,
        total: 30,
      },
      { billing_mode: 'request' },
      t,
      (value) => `${value} USD`,
    ),
    {
      usedText: '12 次',
      totalText: '30 次',
      remainText: '18 次',
    },
  );
});

test('usage metrics clamp percent and remaining amount for overused request subscriptions', () => {
  assert.deepEqual(
    getSubscriptionUsageMetrics(
      {
        used: 35,
        total: 30,
      },
      { billing_mode: 'request' },
      t,
      (value) => `${value} USD`,
    ),
    {
      usedValue: 35,
      totalValue: 30,
      remainValue: 0,
      percent: 100,
      isUnlimited: false,
      usedText: '35 次',
      totalText: '30 次',
      remainText: '0 次',
    },
  );
});

test('usage metrics mark zero total subscriptions as unlimited', () => {
  assert.deepEqual(
    getSubscriptionUsageMetrics(
      {
        used: 750000000,
        total: 0,
      },
      { billing_mode: 'quota' },
      t,
      (value) => `${value / 500000} USD`,
    ),
    {
      usedValue: 750000000,
      totalValue: 0,
      remainValue: 0,
      percent: 0,
      isUnlimited: true,
      usedText: '1500 USD',
      totalText: '0 USD',
      remainText: '0 USD',
    },
  );
});

test('homepage plan filter keeps only enabled plans marked for home display', () => {
  assert.deepEqual(
    filterHomepageSubscriptionPlans([
      { plan: { id: 1, enabled: true, show_on_home: true } },
      { plan: { id: 2, enabled: true, show_on_home: false } },
      { plan: { id: 3, enabled: false, show_on_home: true } },
    ]).map((item) => item.plan.id),
    [1],
  );
});

test('homepage plan filter excludes plans without show_on_home flag by default', () => {
  assert.deepEqual(
    filterHomepageSubscriptionPlans([
      { plan: { id: 1, enabled: true } },
      { plan: { id: 2, enabled: true, show_on_home: false } },
    ]),
    [],
  );
});

test('homepage plan filter preserves API sort order for visible plans', () => {
  assert.deepEqual(
    filterHomepageSubscriptionPlans([
      { plan: { id: 8, enabled: true, show_on_home: true } },
      { plan: { id: 5, enabled: true, show_on_home: true } },
    ]).map((item) => item.plan.id),
    [8, 5],
  );
});

test('homepage plan filter keeps both quota and request visible plans', () => {
  assert.deepEqual(
    filterHomepageSubscriptionPlans([
      {
        plan: {
          id: 1,
          enabled: true,
          show_on_home: true,
          billing_mode: 'quota',
        },
      },
      {
        plan: {
          id: 2,
          enabled: true,
          show_on_home: true,
          billing_mode: 'request',
        },
      },
      {
        plan: {
          id: 3,
          enabled: true,
          show_on_home: false,
          billing_mode: 'request',
        },
      },
    ]).map((item) => item.plan.id),
    [1, 2],
  );
});
