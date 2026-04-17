import test from 'node:test';
import assert from 'node:assert/strict';

import { addCfAsyncToModuleScripts } from './cloudflareRocketLoaderGuard.js';

test('adds data-cfasync to module scripts', () => {
  const html =
    '<script type="module" crossorigin src="/assets/index-abc.js"></script>';

  const result = addCfAsyncToModuleScripts(html);

  assert.equal(
    result,
    '<script data-cfasync="false" type="module" crossorigin src="/assets/index-abc.js"></script>',
  );
});

test('keeps existing data-cfasync attributes unchanged', () => {
  const html =
    '<script data-cfasync="false" type="module" crossorigin src="/assets/index-abc.js"></script>';

  const result = addCfAsyncToModuleScripts(html);

  assert.equal(result, html);
});
