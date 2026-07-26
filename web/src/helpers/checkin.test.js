/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveCheckinClickAction } from './checkin.js';

test('resolveCheckinClickAction opens Turnstile before checkin when enabled', () => {
  assert.equal(
    resolveCheckinClickAction({
      turnstileEnabled: true,
      turnstileSiteKey: '0x4AAAAAAA',
    }),
    'open-turnstile',
  );
});

test('resolveCheckinClickAction reports missing site key before checkin', () => {
  assert.equal(
    resolveCheckinClickAction({
      turnstileEnabled: true,
      turnstileSiteKey: '',
    }),
    'missing-site-key',
  );
});

test('resolveCheckinClickAction allows direct checkin when Turnstile is disabled', () => {
  assert.equal(
    resolveCheckinClickAction({
      turnstileEnabled: false,
      turnstileSiteKey: '',
    }),
    'checkin',
  );
});
