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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { useUpdateOptionsBatch } from '../use-update-option'

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper(props: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {props.children}
      </QueryClientProvider>
    )
  }
  return { client, Wrapper }
}

describe('update options batch', () => {
  beforeEach(() => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true } })
    vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } })
  })

  it('writes all changed options before refreshing the cache once', async () => {
    const { client, Wrapper } = createWrapper()
    let finishRefresh!: () => void
    const refresh = new Promise<void>((resolve) => {
      finishRefresh = resolve
    })
    const invalidate = vi
      .spyOn(client, 'invalidateQueries')
      .mockImplementation(async () => refresh)

    const { result } = renderHook(() => useUpdateOptionsBatch(), {
      wrapper: Wrapper,
    })
    let mutation!: Promise<unknown>
    await act(async () => {
      mutation = result.current.mutateAsync([
        { key: 'topup_campaign_setting.periods', value: '[{"tier":2}]' },
        { key: 'topup_campaign_setting.enabled', value: 'false' },
      ])
      await Promise.resolve()
    })

    expect(vi.mocked(api.put)).toHaveBeenNthCalledWith(1, '/api/option/', {
      key: 'topup_campaign_setting.periods',
      value: '[{"tier":2}]',
    })
    expect(vi.mocked(api.put)).toHaveBeenNthCalledWith(2, '/api/option/', {
      key: 'topup_campaign_setting.enabled',
      value: 'false',
    })
    expect(invalidate).toHaveBeenCalledTimes(1)

    finishRefresh()
    await act(async () => {
      await mutation
    })
  })

  it('does not write later options when an earlier option is rejected', async () => {
    vi.mocked(api.put).mockRejectedValueOnce(new Error('Invalid periods'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateOptionsBatch(), {
      wrapper: Wrapper,
    })

    await expect(
      result.current.mutateAsync([
        { key: 'topup_campaign_setting.periods', value: '[invalid]' },
        { key: 'topup_campaign_setting.enabled', value: 'false' },
      ])
    ).rejects.toThrow('Invalid periods')
    expect(vi.mocked(api.put)).toHaveBeenCalledTimes(1)
  })
})
