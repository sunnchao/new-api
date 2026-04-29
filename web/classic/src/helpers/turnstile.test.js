import test from 'node:test';
import assert from 'node:assert/strict';

import TurnstileModule from 'react-turnstile';
import { resolveTurnstileComponent } from './turnstile.js';

test('resolveTurnstileComponent unwraps react-turnstile module objects', () => {
  assert.equal(typeof TurnstileModule, 'object');

  const Turnstile = resolveTurnstileComponent(TurnstileModule);

  assert.equal(typeof Turnstile, 'function');
});

test('resolveTurnstileComponent preserves function exports', () => {
  const DummyTurnstile = () => null;

  assert.equal(resolveTurnstileComponent(DummyTurnstile), DummyTurnstile);
});
