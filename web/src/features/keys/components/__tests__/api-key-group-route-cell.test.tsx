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

for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Node',
  'Element',
] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

const React = await import('react')
const { act } = React
const { createRoot } = await import('react-dom/client')
const { I18nextProvider } = await import('react-i18next')
const i18next = (await import('@/i18n/config')).default

await import('../../i18n')
const { ApiKeyGroupRouteCell } = await import('../api-key-group-route-cell')
const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

const apiKey = {
  id: 1,
  name: 'fallback-chain',
  key: 'masked',
  status: 1,
  remain_quota: 0,
  used_quota: 0,
  unlimited_quota: true,
  expired_time: -1,
  created_time: 0,
  accessed_time: 0,
  group: 'lobehub',
  cross_group_retry: false,
  model_limits_enabled: false,
  model_limits: '',
  allow_ips: '',
  backup_group: 'default,codex',
}
const groupRatios = { lobehub: 1, default: 1, codex: 0.35 }

describe('API key group route cell', () => {
  after(() => {
    domWindow.close()
  })

  test('shows the complete ordered route chain directly in the table cell', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <I18nextProvider i18n={i18next}>
          <ApiKeyGroupRouteCell apiKey={apiKey} groupRatios={groupRatios} />
        </I18nextProvider>
      )
    })

    const route = container.querySelector('[data-slot="api-key-group-route"]')
    assert.ok(route)
    assert.deepEqual(
      [...route.children].map((step) => step.textContent?.trim()),
      [
        'Primary Grouplobehub1x',
        'Backup Group 1default1x',
        'Backup Group 2codex0.35x',
      ]
    )

    await act(async () => root.unmount())
    container.remove()
  })

  test('translates route roles in every supported locale', async () => {
    const expectedLabels = {
      en: ['Primary Group', 'Backup Group 1', 'Backup Group 2'],
      zhCN: ['主分组', '备用分组 1', '备用分组 2'],
      zhTW: ['主分組', '備用分組 1', '備用分組 2'],
      fr: ['Groupe principal', 'Groupe de secours 1', 'Groupe de secours 2'],
      ja: ['メイングループ', '予備グループ 1', '予備グループ 2'],
      ru: ['Основная группа', 'Резервная группа 1', 'Резервная группа 2'],
      vi: ['Nhóm chính', 'Nhóm dự phòng 1', 'Nhóm dự phòng 2'],
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    for (const [language, labels] of Object.entries(expectedLabels)) {
      await act(async () => {
        await i18next.changeLanguage(language)
        root.render(
          <I18nextProvider i18n={i18next}>
            <ApiKeyGroupRouteCell apiKey={apiKey} groupRatios={groupRatios} />
          </I18nextProvider>
        )
      })

      assert.deepEqual(
        [
          ...container.querySelectorAll(
            '[data-slot="api-key-group-route-role"]'
          ),
        ].map((role) => role.textContent?.trim()),
        labels
      )
    }

    await act(async () => root.unmount())
    container.remove()
  })
})
