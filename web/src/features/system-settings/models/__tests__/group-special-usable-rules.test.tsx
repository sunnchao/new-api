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
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { GroupSpecialUsableRulesEditor } from '../group-special-usable-editor'
import { parseSpecialGroupKey, toSpecialGroupKey } from '../special-group-key'

const groupOptions = ['default', 'vip', 'ultra']

function lastSerialized(onChange: ReturnType<typeof vi.fn>) {
  return JSON.parse(onChange.mock.calls.at(-1)?.[0] as string)
}

describe('special group key', () => {
  it.each([
    ['+:ultra', { mode: 'visible', groupName: 'ultra' }],
    ['ultra', { mode: 'visible', groupName: 'ultra' }],
    ['-:ultra', { mode: 'hidden', groupName: 'ultra' }],
    ['sub:ultra', { mode: 'subscription', groupName: 'ultra' }],
  ])('parses %s into its visibility mode and group', (rawKey, expected) => {
    expect(parseSpecialGroupKey(rawKey)).toEqual(expected)
  })

  it('serializes each mode with the prefix the backend understands', () => {
    expect(toSpecialGroupKey('visible', 'ultra')).toBe('+:ultra')
    expect(toSpecialGroupKey('hidden', 'ultra')).toBe('-:ultra')
    expect(toSpecialGroupKey('subscription', 'ultra')).toBe('sub:ultra')
  })
})

describe('special usable group rules editor', () => {
  it('shows a saved sub: rule as subscription unlock and keeps its prefix when the description is edited', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GroupSpecialUsableRulesEditor
        value='{"vip":{"sub:ultra":"Ultra"}}'
        groupOptions={groupOptions}
        onChange={onChange}
      />
    )

    expect(
      screen.getByRole('combobox', { name: 'Group visibility' })
    ).toHaveTextContent('Subscription unlock')
    await user.type(
      screen.getByRole('textbox', { name: 'Description' }),
      ' plan'
    )

    expect(lastSerialized(onChange)).toEqual({
      vip: { 'sub:ultra': 'Ultra plan' },
    })
  })

  it('serializes a visible rule switched to subscription unlock with the sub: prefix and its description', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GroupSpecialUsableRulesEditor
        value='{"vip":{"+:ultra":"Ultra"}}'
        groupOptions={groupOptions}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole('combobox', { name: 'Group visibility' }))
    await user.click(
      screen.getByRole('option', { name: 'Subscription unlock' })
    )

    expect(lastSerialized(onChange)).toEqual({ vip: { 'sub:ultra': 'Ultra' } })
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'Ultra'
    )
  })

  it('drops the remove marker when a hidden rule is switched to subscription unlock', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GroupSpecialUsableRulesEditor
        value='{"vip":{"-:ultra":"remove"}}'
        groupOptions={groupOptions}
        onChange={onChange}
      />
    )
    expect(
      screen.queryByRole('textbox', { name: 'Description' })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Group visibility' }))
    await user.click(
      screen.getByRole('option', { name: 'Subscription unlock' })
    )

    expect(lastSerialized(onChange)).toEqual({ vip: { 'sub:ultra': '' } })
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('')
  })

  it('restores the remove marker when a subscription unlock rule is switched to hidden', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <GroupSpecialUsableRulesEditor
        value='{"vip":{"sub:ultra":"Ultra"}}'
        groupOptions={groupOptions}
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole('combobox', { name: 'Group visibility' }))
    await user.click(screen.getByRole('option', { name: 'Hidden' }))

    expect(lastSerialized(onChange)).toEqual({ vip: { '-:ultra': 'remove' } })
  })
})
