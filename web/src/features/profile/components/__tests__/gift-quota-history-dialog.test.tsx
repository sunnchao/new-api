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
import assert from 'node:assert/strict'
import { after, describe, test } from 'node:test'

import { Window } from 'happy-dom'

const domWindow = new Window()
const domGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLButtonElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'MutationObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle',
] as const

for (const key of domGlobals) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { QueryClient, QueryClientProvider } =
  await import('@tanstack/react-query')
const { I18nextProvider } = await import('react-i18next')
const i18next = (await import('@/i18n/config')).default
const { api } = await import('@/lib/api')
const { formatQuota } = await import('@/lib/format')

await import('../../i18n')
const { GiftQuotaHistoryDialog } =
  await import('../dialogs/gift-quota-history-dialog')

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('gift quota history dialog', () => {
  after(() => {
    domWindow.close()
  })

  test('loads on open, displays grant details, and requests the next page', async () => {
    await i18next.changeLanguage('en')
    const calls: Array<{ url: string; page: number; pageSize: number }> = []
    const originalGet = api.get
    api.get = (async (url, config) => {
      const page = Number(config?.params?.p)
      const pageSize = Number(config?.params?.page_size)
      calls.push({ url, page, pageSize })

      const item =
        page === 1
          ? {
              id: 2,
              source: 'checkin',
              quota: 1000,
              created_at: 1717200000,
              expires_at: 0,
            }
          : {
              id: 1,
              source: 'topup_bonus',
              quota: 2000,
              created_at: 1717100000,
              expires_at: 1717300000,
            }

      return {
        data: {
          success: true,
          message: '',
          data: {
            page,
            page_size: pageSize,
            total: 11,
            items: [item],
          },
        },
      }
    }) as typeof api.get

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    try {
      await act(async () => {
        root.render(
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18next}>
              <GiftQuotaHistoryDialog giftQuota={5000} />
            </I18nextProvider>
          </QueryClientProvider>
        )
      })

      assert.equal(calls.length, 0)
      const trigger = container.querySelector('button')
      assert.ok(trigger)

      await act(async () => {
        trigger.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      assert.deepEqual(calls[0], {
        url: '/api/user/gift-quota/history',
        page: 1,
        pageSize: 10,
      })
      const dialogText = document.body.textContent ?? ''
      for (const text of [
        'Acquired quota',
        'Channel',
        'Acquired at',
        'Expires at',
        'Check-in',
        'Permanent',
        formatQuota(1000),
      ]) {
        assert.equal(dialogText.includes(text), true, `missing ${text}`)
      }

      const nextButton = document.body.querySelector<HTMLButtonElement>(
        'button[aria-label="Next"]'
      )
      assert.ok(nextButton)
      const secondPageReady = new Promise<void>((resolve) => {
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
          if (
            event.query.queryKey[2] === 2 &&
            event.query.state.status === 'success'
          ) {
            unsubscribe()
            resolve()
          }
        })
      })
      await act(async () => {
        nextButton.click()
        await secondPageReady
      })

      assert.deepEqual(calls[1], {
        url: '/api/user/gift-quota/history',
        page: 2,
        pageSize: 10,
      })
    } finally {
      api.get = originalGet
      await act(async () => root.unmount())
      container.remove()
      queryClient.clear()
    }
  })
})
