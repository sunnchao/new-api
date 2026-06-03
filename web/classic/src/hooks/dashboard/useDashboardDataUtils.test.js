import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeQuotaDataListPayload,
  normalizeDashboardQuotaDataPayload,
} from './useDashboardDataUtils.js';

test('normalizes dashboard quota payloads from arrays or paginated items', () => {
  const records = [
    { model_name: 'gpt-4o', created_at: 20, quota: 2, count: 1 },
    { model_name: 'claude', created_at: 10, quota: 3, count: 2 },
  ];

  assert.deepEqual(normalizeQuotaDataListPayload({ items: records }), [
    {
      model_name: 'claude',
      created_at: 10,
      quota: 3,
      count: 2,
      token_used: 0,
    },
    {
      model_name: 'gpt-4o',
      created_at: 20,
      quota: 2,
      count: 1,
      token_used: 0,
    },
  ]);
  assert.equal(records[0].model_name, 'gpt-4o');
});

test('dashboard quota payload falls back to a zero data point for empty input', () => {
  assert.deepEqual(normalizeDashboardQuotaDataPayload(null, 100), [
    {
      count: 0,
      model_name: '无数据',
      quota: 0,
      token_used: 0,
      created_at: 100,
    },
  ]);
});
