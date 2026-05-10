import { expect, test } from 'bun:test'
import {
  ADMIN_TOKEN_FORM_DEFAULT_VALUES,
  adminTokenFormSchema,
  transformAdminTokenFormDataToPayload,
  transformAdminTokenToFormDefaults,
} from '../../src/features/admin-tokens/lib/admin-token-form'

test('requires an explicit positive owner user id', () => {
  const result = adminTokenFormSchema.safeParse({
    ...ADMIN_TOKEN_FORM_DEFAULT_VALUES,
    name: 'admin-key',
    user_id: 0,
  })

  expect(result.success).toBe(false)
  expect(result.error?.issues[0]?.message).toBe('Please enter a valid user ID')
})

test('serializes admin token form values with owner and drawing mode', () => {
  const payload = transformAdminTokenFormDataToPayload({
    ...ADMIN_TOKEN_FORM_DEFAULT_VALUES,
    user_id: 42,
    name: 'admin-key',
    group: 'default',
    backup_group: ['vip', 'paid', 'default', ''],
    mj_model: 'turbo',
  })

  expect(payload).toMatchObject({
    user_id: 42,
    name: 'admin-key',
    backup_group: 'vip,paid',
    mj_model: 'turbo',
  })
})

test('maps an existing admin token to editable form defaults', () => {
  const defaults = transformAdminTokenToFormDefaults({
    id: 7,
    user_id: 42,
    user_name: 'alice',
    name: 'admin-key',
    key: 'abcd****wxyz',
    status: 1,
    remain_quota: 500000,
    used_quota: 100000,
    unlimited_quota: false,
    expired_time: -1,
    created_time: 1700000000,
    accessed_time: 1700000000,
    group: 'default',
    cross_group_retry: false,
    model_limits_enabled: false,
    model_limits: '',
    mj_model: 'fast',
    allow_ips: '',
    backup_group: 'vip,paid',
  })

  expect(defaults.user_id).toBe(42)
  expect(defaults.mj_model).toBe('fast')
  expect(defaults.backup_group).toEqual(['vip', 'paid'])
})
