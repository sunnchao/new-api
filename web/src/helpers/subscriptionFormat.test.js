import test from 'node:test';
import assert from 'node:assert/strict';

import {
  convertSubscriptionAmountToFormValue,
  convertSubscriptionAmountToStorageValue,
  formatSubscriptionUsageSummary,
  formatSubscriptionAmountValue,
  formatSubscriptionQuotaLimitSummary,
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
