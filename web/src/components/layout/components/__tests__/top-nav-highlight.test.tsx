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
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import i18next from '@/i18n/config'

import type { TopNavLink } from '../../types'
import { TopNav } from '../top-nav'

const campaignLink: TopNavLink = {
  title: 'Top-up Bonus',
  href: '/activities/double11',
  variant: 'promotion',
}

function renderTopNav(links: TopNavLink[]) {
  const queryClient = new QueryClient()
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <TopNav links={links} />,
  })
  const activityRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/activities/double11',
    component: () => <div>Activity</div>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, activityRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  i18next.changeLanguage('en')
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('top navigation promotion link', () => {
  it('marks the campaign entry with a promotion treatment and an icon', async () => {
    renderTopNav([
      { title: 'Home', href: '/' },
      campaignLink,
      { title: 'About', href: '/about' },
    ])

    const promotion = await screen.findByRole('link', {
      name: 'Top-up Bonus',
      hidden: true,
    })
    expect(promotion.dataset.variant).toBe('promotion')
    expect(promotion.querySelector('svg')).not.toBeNull()
    expect(promotion.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(
      screen.getAllByRole('link', { name: 'Home' })[0].dataset.variant
    ).toBe('default')
    expect(
      screen.getAllByRole('link', { name: 'About' })[0].dataset.variant
    ).toBe('default')
  })

  it('keeps ordinary links unstyled when no campaign entry is visible', async () => {
    renderTopNav([
      { title: 'Home', href: '/' },
      { title: 'About', href: '/about' },
    ])

    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Top-up Bonus' })
      ).not.toBeInTheDocument()
    )
    expect(document.querySelector('[data-variant="promotion"]')).toBeNull()
  })
})
