import { beforeEach, expect, mock, test } from 'bun:test'

const apiMock = {
  get: mock(async () => ({ data: { success: true } })),
  post: mock(async () => ({ data: { success: true } })),
  put: mock(async () => ({ data: { success: true } })),
  delete: mock(async () => ({ data: { success: true } })),
}

mock.module('@/lib/api', () => ({
  api: apiMock,
}))

const {
  getAdminToken,
  createAdminToken,
  updateAdminToken,
  updateAdminTokenStatus,
  deleteAdminToken,
  batchDeleteAdminTokens,
} = await import('../../src/features/admin-tokens/api')

const adminTokenPayload = {
  user_id: 42,
  name: 'admin-created-key',
  expired_time: -1,
  remain_quota: 0,
  unlimited_quota: true,
  model_limits_enabled: false,
  model_limits: '',
  mj_model: '',
  allow_ips: '',
  group: '',
  cross_group_retry: false,
  backup_group: '',
}

beforeEach(() => {
  apiMock.get.mockClear()
  apiMock.post.mockClear()
  apiMock.put.mockClear()
  apiMock.delete.mockClear()
})

test('fetches a single admin token by id', async () => {
  await getAdminToken(7)

  expect(apiMock.get).toHaveBeenCalledWith('/api/admin/token/7')
})

test('creates an admin token with an explicit owner user id', async () => {
  await createAdminToken(adminTokenPayload)

  expect(apiMock.post).toHaveBeenCalledWith('/api/admin/token', adminTokenPayload)
})

test('updates an admin token without changing the owner', async () => {
  await updateAdminToken({ ...adminTokenPayload, id: 7 })

  expect(apiMock.put).toHaveBeenCalledWith('/api/admin/token', {
    ...adminTokenPayload,
    id: 7,
  })
})

test('updates admin token status through the status-only endpoint', async () => {
  await updateAdminTokenStatus(7, 2)

  expect(apiMock.put).toHaveBeenCalledWith('/api/admin/token?status_only=true', {
    id: 7,
    status: 2,
  })
})

test('deletes a single admin token by id', async () => {
  await deleteAdminToken(7)

  expect(apiMock.delete).toHaveBeenCalledWith('/api/admin/token/7')
})

test('batch deletes selected admin tokens', async () => {
  await batchDeleteAdminTokens([7, 8])

  expect(apiMock.post).toHaveBeenCalledWith('/api/admin/token/batch', {
    ids: [7, 8],
  })
})
