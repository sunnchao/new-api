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
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, test } from 'vitest'

import i18next from '@/i18n/config'

import '../i18n'
import type { TopupCampaignInfo } from '../types'
import { MyProgressCard } from '../components/my-progress-card'

afterEach(() => {
  cleanup()
})

function campaignInfo(
  overrides: Partial<TopupCampaignInfo> = {}
): TopupCampaignInfo {
  return {
    enabled: true,
    campaign_key: 'double11-2026',
    start_time: 1793894400,
    end_time: 1794412799,
    day_bonus_start: 1794326400,
    day_bonus_end: 1794412799,
    day_bonus_rate: 0.05,
    tiers: [{ min_amount: 100, bonus_amount: 10 }],
    status: 'live',
    server_time: 1794000000,
    self: {
      cumulative_amount: 550,
      tier_bonus_granted: 55,
      day_bonus_granted: 27.5,
      current_tier_index: 0,
      top_reached: true,
    },
    ...overrides,
  }
}

async function renderCard(info: TopupCampaignInfo) {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <MyProgressCard info={info} />,
  })
  const signInRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sign-in',
    component: () => <div>sign in</div>,
  })
  const walletRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/wallet',
    component: () => <div>wallet</div>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, signInRoute, walletRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  await i18next.changeLanguage('en')
  render(
    <I18nextProvider i18n={i18next}>
      <RouterProvider router={router} />
    </I18nextProvider>
  )
}

describe('campaign progress card', () => {
  test('hides progress while the event has not started', async () => {
    await renderCard(campaignInfo({ status: 'upcoming' }))

    expect(
      await screen.findByText(
        'The event has not started yet; top-ups completed after it begins will count toward your progress.'
      )
    ).toBeTruthy()
    expect(screen.queryByText('$550')).toBeNull()
    expect(screen.queryByText('Bonus received')).toBeNull()
  })

  test('shows cumulative progress once the event is running', async () => {
    await renderCard(campaignInfo())

    expect(await screen.findByText('Cumulative top-up')).toBeTruthy()
    expect(screen.getByText('Bonus received')).toBeTruthy()
    expect(screen.queryByText(/The event has not started yet/)).toBeNull()
  })
})
