import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRedemptionPayload,
  getRedemptionFormValues,
} from './redemptionForm.js';

test('quota redemption payload converts display amount and clears subscription plan', () => {
  const payload = buildRedemptionPayload(
    {
      name: 'quota-code',
      type: 'quota',
      amount: 12.5,
      count: '3',
      subscription_plan_id: 9,
      expired_time: new Date('2026-01-02T03:04:05Z'),
    },
    {
      displayAmountToQuota: (amount) => amount * 1000,
    },
  );

  assert.deepEqual(payload, {
    name: 'quota-code',
    type: 'quota',
    quota: 12500,
    subscription_plan_id: 0,
    count: 3,
    expired_time: 1767323045,
  });
});

test('subscription redemption payload keeps explicit plan and sends zero quota', () => {
  const payload = buildRedemptionPayload(
    {
      name: 'sub-code',
      type: 'subscription',
      amount: 99,
      count: 2,
      subscription_plan_id: '7',
      expired_time: null,
    },
    {
      displayAmountToQuota: () => {
        throw new Error('subscription payload should not convert quota');
      },
    },
  );

  assert.deepEqual(payload, {
    name: 'sub-code',
    type: 'subscription',
    quota: 0,
    subscription_plan_id: 7,
    count: 2,
    expired_time: 0,
  });
});

test('redemption form values restore subscription redemptions for editing', () => {
  assert.deepEqual(
    getRedemptionFormValues(
      {
        name: 'existing-sub',
        type: 'subscription',
        quota: 123456,
        subscription_plan_id: 11,
        count: 42,
        expired_time: 1767323045,
      },
      {
        quotaToDisplayAmount: (quota) => quota / 1000,
      },
    ),
    {
      name: 'existing-sub',
      type: 'subscription',
      quota: 0,
      amount: 0,
      count: 1,
      subscription_plan_id: 11,
      expired_time: new Date('2026-01-02T03:04:05Z'),
    },
  );
});
