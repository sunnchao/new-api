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
  'HTMLTextAreaElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
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

const React = await import('react')
const { act } = React
const { createRoot } = await import('react-dom/client')
const { useForm } = await import('react-hook-form')
const i18next = (await import('i18next')).default
const { initReactI18next } = await import('react-i18next')

await i18next.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
})

const { GroupRatioForm } = await import('../group-ratio-form')
const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

function GroupRatioFormHarness() {
  const form = useForm({
    defaultValues: {
      GroupRatio: '{}',
      TopupGroupRatio: '{}',
      UserUsableGroups: '{}',
      UserUnselectableGroups: '{}',
      GroupGroupRatio: '{}',
      GroupClientRestrictions: '{}',
      AutoGroups: '[]',
      DefaultUseAutoGroup: false,
      GroupSpecialUsableGroup: '{}',
    },
  })

  return (
    <GroupRatioForm
      form={form}
      onSave={async () => undefined}
      isSaving={false}
    />
  )
}

describe('GroupRatioForm JSON editors', () => {
  after(() => {
    domWindow.close()
  })

  test('renders JSON fields in visual and JSON edit modes without crashing', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(<GroupRatioFormHarness />)
    })

    assert.equal(container.querySelectorAll('.json-code-editor-yace').length, 1)

    const switchButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('Switch to JSON')
    )
    assert.ok(switchButton)

    await act(async () => switchButton.click())

    assert.equal(container.querySelectorAll('.json-code-editor-yace').length, 8)

    await act(async () => root.unmount())
    container.remove()
  })
})
