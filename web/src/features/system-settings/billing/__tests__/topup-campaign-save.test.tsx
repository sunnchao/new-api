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
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { useMemo, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { topupCampaignI18nResources } from '@/features/topup-campaign/i18n'
import { api } from '@/lib/api'

import { SettingsPageProvider } from '../../components/settings-page-context'
import { useSystemOptions } from '../../hooks/use-system-options'
import { TopupCampaignSection } from '../topup-campaign-section'

const persistedPeriods = JSON.stringify([
  {
    campaign_key: 'nov',
    start_time: 1793862540,
    end_time: 1793948940,
    day_bonus_start: 0,
    day_bonus_end: 0,
    day_bonus_rate: 0,
    tiers: [{ min_amount: 100, bonus_amount: 10 }],
    whitelist_user_ids: [],
  },
])

function Fixture(props: { enabled: boolean }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  useSystemOptions()
  const defaultValues = useMemo(
    () => ({
      enabled: props.enabled,
      periods: JSON.parse(persistedPeriods),
    }),
    [props.enabled]
  )
  return (
    <>
      <div ref={setContainer} />
      <SettingsPageProvider actionsContainer={container}>
        <TopupCampaignSection defaultValues={defaultValues} />
      </SettingsPageProvider>
    </>
  )
}

function renderSettings(enabled: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <Fixture enabled={enabled} />
    </QueryClientProvider>
  )
}

function mockOptions(requests: Array<{ key: string; value: unknown }>) {
  const options = [
    { key: 'topup_campaign_setting.enabled', value: 'true' },
    { key: 'topup_campaign_setting.periods', value: persistedPeriods },
  ]
  const get = vi.spyOn(api, 'get').mockImplementation(async () => ({
    data: { success: true, message: '', data: options },
  }))
  const put = vi.spyOn(api, 'put').mockImplementation(async (_url, body) => {
    const request = body as { key: string; value: unknown }
    requests.push(request)
    const option = options.find((item) => item.key === request.key)
    if (option) option.value = String(request.value)
    await Promise.resolve()
    return { data: { success: true, message: '' } }
  })
  return { get, put }
}

describe('top-up campaign settings save', () => {
  it('edits a campaign in a dialog and keeps the switch state after saving', async () => {
    const user = userEvent.setup()
    i18next.addResourceBundle(
      'en',
      'translation',
      topupCampaignI18nResources.en.translation,
      true,
      true
    )
    const requests: Array<{ key: string; value: unknown }> = []
    const { get, put } = mockOptions(requests)

    renderSettings(true)
    const toggle = await screen.findByRole('switch', {
      name: 'Enable top-up campaign',
    })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('button', { name: 'Edit campaign nov' }))
    expect(
      await screen.findByRole('dialog', { name: 'Edit campaign' })
    ).toBeInTheDocument()
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Minimum top-up (USD)' }),
      { target: { value: '200' } }
    )
    await user.click(screen.getByRole('button', { name: 'Save campaign' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Edit campaign' })
      ).not.toBeInTheDocument()
    )

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await user.click(
      screen.getByRole('button', { name: 'Save top-up campaign settings' })
    )

    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[0].key).toBe('topup_campaign_setting.periods')
    const savedPeriods = JSON.parse(String(requests[0].value))
    expect(savedPeriods[0].tiers[0].min_amount).toBe(200)
    expect(savedPeriods[0].whitelist_user_ids).toEqual([])
    expect(requests[1]).toEqual({
      key: 'topup_campaign_setting.enabled',
      value: 'false',
    })
    expect(get).toHaveBeenCalled()
    expect(put).toHaveBeenCalledTimes(2)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(
      screen.getByRole('button', { name: 'Save top-up campaign settings' })
    ).toBeDisabled()
  })

  it('creates a new campaign and opens its editor', async () => {
    const user = userEvent.setup()
    i18next.addResourceBundle(
      'en',
      'translation',
      topupCampaignI18nResources.en.translation,
      true,
      true
    )
    const requests: Array<{ key: string; value: unknown }> = []
    mockOptions(requests)

    renderSettings(true)
    await user.click(
      await screen.findByRole('button', { name: 'Add campaign' })
    )
    expect(
      await screen.findByRole('dialog', { name: 'Edit campaign' })
    ).toBeInTheDocument()
    const keyInput = screen.getByRole('textbox', { name: 'Campaign key' })
    await user.clear(keyInput)
    await user.type(keyInput, 'december')
    await user.click(screen.getByRole('button', { name: 'Save campaign' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Edit campaign' })
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('december')).toBeInTheDocument()

    await waitFor(() => expect(requests).toHaveLength(1))
    const savedPeriods = JSON.parse(String(requests[0].value))
    expect(savedPeriods).toHaveLength(2)
    expect(savedPeriods[0].campaign_key).toBe('december')
  })

  it('rejects a new campaign whose window overlaps an existing one', async () => {
    const user = userEvent.setup()
    i18next.addResourceBundle(
      'en',
      'translation',
      topupCampaignI18nResources.en.translation,
      true,
      true
    )
    const requests: Array<{ key: string; value: unknown }> = []
    mockOptions(requests)

    renderSettings(true)
    await user.click(
      await screen.findByRole('button', { name: 'Add campaign' })
    )
    await screen.findByRole('dialog', { name: 'Edit campaign' })
    fireEvent.change(screen.getByLabelText('Campaign start (UTC+8)'), {
      target: { value: '2026-11-01T00:00' },
    })
    fireEvent.change(screen.getByLabelText('Campaign end (UTC+8)'), {
      target: { value: '2026-11-30T23:59' },
    })

    await user.click(screen.getByRole('button', { name: 'Save campaign' }))

    expect(
      await screen.findByText('Campaign periods cannot overlap')
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })
})
