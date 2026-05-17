import { expect, test } from 'bun:test'
import type { TFunction } from 'i18next'
import {
  API_KEY_FORM_DEFAULT_VALUES,
  getApiKeyFormSchema,
  normalizeBackupGroupDraft,
  normalizeBackupGroups,
  transformFormDataToPayload,
} from '../../src/features/keys/lib/api-key-form'

const t = ((key: string) => key) as TFunction
const apiKeyFormSchema = getApiKeyFormSchema(t)

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

test('keeps one empty backup group row while editing a draft', () => {
  expect(normalizeBackupGroupDraft([''], 'default')).toEqual([''])
  expect(normalizeBackupGroupDraft(['vip', '', 'vip', 'default'], 'default')).toEqual([
    'vip',
    '',
  ])
})

test('uses the localized name validation key', () => {
  const result = apiKeyFormSchema.safeParse(API_KEY_FORM_DEFAULT_VALUES)

  expect(result.success).toBe(false)
  expect(result.error?.issues[0]?.message).toBe('Please enter a name')
})

test('does not validate quota amount when unlimited quota is enabled', () => {
  const result = apiKeyFormSchema.safeParse({
    ...API_KEY_FORM_DEFAULT_VALUES,
    name: 'unlimited-key',
    unlimited_quota: true,
    remain_quota_dollars: -1,
  })

  expect(result.success).toBe(true)
})
