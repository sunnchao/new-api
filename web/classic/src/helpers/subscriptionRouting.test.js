import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSubscriptionCheckoutPath,
  buildSubscriptionLoginState,
  findSubscriptionPlanRecord,
} from './subscriptionRouting.js';

test('builds my-subscriptions checkout path with encoded plan id', () => {
  assert.equal(
    buildSubscriptionCheckoutPath('plan 7'),
    '/console/subscriptions?subscribe_plan=plan+7',
  );
});

test('builds login state that returns to checkout path after authentication', () => {
  assert.deepEqual(buildSubscriptionLoginState('plan 7'), {
    from: {
      pathname: '/console/subscriptions',
      search: '?subscribe_plan=plan+7',
      hash: '',
    },
  });
});

test('finds a subscription plan record by query plan id', () => {
  const plans = [
    { plan: { id: 3, title: 'Basic' } },
    { plan: { id: 8, title: 'Pro' } },
  ];

  assert.deepEqual(findSubscriptionPlanRecord(plans, '8'), plans[1]);
});
