import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeHealthModelsPayload } from './useHealthDataUtils.js';

test('normalizes paginated model response items for health dashboard', () => {
  const models = [
    { id: 1, model_name: 'gpt-4o', bound_channels: [{ id: 10 }] },
    { id: 2, model_name: 'claude-sonnet-4', bound_channels: [] },
  ];

  assert.deepEqual(
    normalizeHealthModelsPayload({
      items: models,
      total: 2,
      page: 1,
      page_size: 10,
    }),
    models,
  );
});

test('preserves legacy model array responses for health dashboard', () => {
  const models = [{ id: 1, model_name: 'gpt-4o' }];

  assert.deepEqual(normalizeHealthModelsPayload(models), models);
});

test('falls back to an empty model list for unexpected health payloads', () => {
  assert.deepEqual(normalizeHealthModelsPayload({ items: null }), []);
  assert.deepEqual(normalizeHealthModelsPayload(null), []);
});
