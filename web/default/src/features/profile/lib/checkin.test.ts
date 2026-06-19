import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { resolveCheckinClickAction } from './checkin'

describe('resolveCheckinClickAction', () => {
  test('opens Turnstile before checkin when enabled', () => {
    assert.equal(
      resolveCheckinClickAction({
        turnstileEnabled: true,
        turnstileSiteKey: '0x4AAAAAAA',
      }),
      'open-turnstile'
    )
  })

  test('reports missing site key before checkin', () => {
    assert.equal(
      resolveCheckinClickAction({
        turnstileEnabled: true,
        turnstileSiteKey: '',
      }),
      'missing-site-key'
    )
  })

  test('allows direct checkin when Turnstile is disabled', () => {
    assert.equal(
      resolveCheckinClickAction({
        turnstileEnabled: false,
        turnstileSiteKey: '',
      }),
      'checkin'
    )
  })
})
