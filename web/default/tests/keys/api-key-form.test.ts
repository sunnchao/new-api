import { expect, test } from 'bun:test'
import {
  API_KEY_FORM_DEFAULT_VALUES,
  normalizeBackupGroups,
  transformFormDataToPayload,
} from '../../src/features/keys/lib/api-key-form'

test('normalizes backup groups while preserving fallback order', () => {
  expect(
    normalizeBackupGroups(['paid', '', 'auto', 'vip', 'paid', 'default'], 'default')
  ).toEqual(['paid', 'vip'])
})

test('serializes backup groups in api key payload', () => {
  const payload = transformFormDataToPayload({
    ...API_KEY_FORM_DEFAULT_VALUES,
    name: 'fallback-key',
    group: 'default',
    backup_group: ['vip', 'paid', 'vip', 'default', 'auto', ''],
  })

  expect(payload.backup_group).toBe('vip,paid')
})
