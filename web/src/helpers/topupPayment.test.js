import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTopupPaymentConfig } from './topupPayment.js';

const fallbackPresets = (minTopUp) => [
  { value: minTopUp },
  { value: minTopUp * 5 },
];

test('normalizes string pay methods and generates fallback presets', () => {
  const result = normalizeTopupPaymentConfig(
    {
      pay_methods: JSON.stringify([
        { name: '支付宝', type: 'alipay', min_topup: '3' },
        { name: 'Stripe', type: 'stripe' },
        { name: '', type: 'wxpay' },
      ]),
      enable_online_topup: false,
      enable_stripe_topup: true,
      stripe_min_topup: '20',
      amount_options: [],
      discount: {},
      creem_products: '[{"name":"Starter","price":"9.9"}]',
    },
    { generatePresetAmounts: fallbackPresets },
  );

  assert.equal(result.enableOnlineTopUp, false);
  assert.equal(result.enableStripeTopUp, true);
  assert.equal(result.minTopUpValue, 20);
  assert.deepEqual(result.payMethods, [
    {
      name: '支付宝',
      type: 'alipay',
      min_topup: 3,
      color: 'rgba(var(--semi-blue-5), 1)',
    },
    {
      name: 'Stripe',
      type: 'stripe',
      min_topup: 20,
      color: 'rgba(var(--semi-purple-5), 1)',
    },
  ]);
  assert.deepEqual(result.presetAmounts, [{ value: 20 }, { value: 100 }]);
  assert.deepEqual(result.creemProducts, [{ name: 'Starter', price: '9.9' }]);
});

test('uses explicit amount options and drops invalid creem payloads', () => {
  const result = normalizeTopupPaymentConfig(
    {
      pay_methods: [
        { name: '余额', type: 'balance', color: '' },
        { name: '无效项' },
      ],
      enable_online_topup: true,
      min_topup: 5,
      amount_options: [10, 50],
      discount: { 10: 0.95 },
      creem_products: 'not-json',
    },
    { generatePresetAmounts: fallbackPresets },
  );

  assert.equal(result.enableOnlineTopUp, true);
  assert.equal(result.enableStripeTopUp, false);
  assert.equal(result.minTopUpValue, 5);
  assert.deepEqual(result.payMethods, [
    {
      name: '余额',
      type: 'balance',
      color: 'rgba(var(--semi-primary-5), 1)',
      min_topup: 0,
    },
  ]);
  assert.deepEqual(result.presetAmounts, [
    { value: 10, discount: 0.95 },
    { value: 50, discount: 1 },
  ]);
  assert.deepEqual(result.creemProducts, []);
});
