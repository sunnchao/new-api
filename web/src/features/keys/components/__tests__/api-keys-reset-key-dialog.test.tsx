/*
Copyright (C) 2023-2026 QuantumNous

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
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { Toaster, toast } from 'sonner'
import { afterEach, expect, it } from 'vitest'

import { api } from '@/lib/api'

import { apiKeySchema, type ApiKey } from '../../types'
import { ApiKeysProvider, useApiKeys } from '../api-keys-provider'
import { ApiKeysResetKeyDialog } from '../api-keys-reset-key-dialog'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initAsync: false,
})

const apiKey = apiKeySchema.parse({
  id: 11,
  name: 'production',
  key: 'sk-****old****',
  status: 1,
  remain_quota: 0,
  used_quota: 0,
  unlimited_quota: true,
  expired_time: -1,
  created_time: 0,
  accessed_time: 0,
  group: 'default',
  model_limits_enabled: false,
})

type PostMethod = (url: string, data?: unknown) => Promise<{ data: unknown }>
const apiClient = api as unknown as { post: PostMethod; get: unknown }
const originalPost = apiClient.post

afterEach(() => {
  cleanup()
  toast.dismiss()
  apiClient.post = originalPost
})

function OpenResetDialog(props: { apiKey: ApiKey }) {
  const { setCurrentRow, setOpen } = useApiKeys()
  return (
    <button
      type='button'
      onClick={() => {
        setCurrentRow(props.apiKey)
        setOpen('reset-key')
      }}
    >
      open reset
    </button>
  )
}

function renderDialog() {
  render(
    <I18nextProvider i18n={i18n}>
      <ApiKeysProvider>
        <OpenResetDialog apiKey={apiKey} />
        <ApiKeysResetKeyDialog />
        <Toaster />
      </ApiKeysProvider>
    </I18nextProvider>
  )
}

it('shows the new key after the user confirms the reset', async () => {
  const user = userEvent.setup()
  const requestedUrls: string[] = []
  apiClient.post = async (url) => {
    requestedUrls.push(url)
    return { data: { success: true, data: { key: 'newsecret0001' } } }
  }

  renderDialog()
  await user.click(screen.getByRole('button', { name: 'open reset' }))

  const confirmDialog = await screen.findByRole('alertdialog')
  expect(within(confirmDialog).getByText('production')).toBeVisible()

  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Reset Key' })
  )

  const resultDialog = await screen.findByRole('dialog', {
    name: 'New API key',
  })
  expect(
    within(resultDialog).getByDisplayValue('sk-newsecret0001')
  ).toBeVisible()
  expect(requestedUrls).toEqual(['/api/token/11/reset-key'])
})

it('keeps the previous key when the user cancels', async () => {
  const user = userEvent.setup()
  let requested = false
  apiClient.post = async () => {
    requested = true
    return { data: { success: true, data: { key: 'unused' } } }
  }

  renderDialog()
  await user.click(screen.getByRole('button', { name: 'open reset' }))
  const confirmDialog = await screen.findByRole('alertdialog')

  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Cancel' })
  )

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(requested).toBe(false)
})

it('keeps the confirmation open when the reset fails', async () => {
  const user = userEvent.setup()
  apiClient.post = async () => ({
    data: { success: false, message: 'reset rejected' },
  })

  renderDialog()
  await user.click(screen.getByRole('button', { name: 'open reset' }))
  const confirmDialog = await screen.findByRole('alertdialog')

  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Reset Key' })
  )

  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'New API key' })).toBeNull()
  )
  expect(screen.getByRole('alertdialog')).toBeVisible()
})
