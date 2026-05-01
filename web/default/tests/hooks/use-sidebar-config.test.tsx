import { expect, mock, test } from 'bun:test'
import { Buffer } from 'node:buffer'
import { renderToStaticMarkup } from 'react-dom/server'
import type { NavGroup } from '@/components/layout/types'

let sidebarModulesAdmin = ''

mock.module('@/hooks/use-status', () => ({
  useStatus: () => ({
    status: { SidebarModulesAdmin: sidebarModulesAdmin },
    loading: false,
    error: null,
  }),
}))

const { useSidebarConfig } = await import(
  '../../src/hooks/use-sidebar-config'
)

function renderFilteredNavGroups(navGroups: NavGroup[]): NavGroup[] {
  function Probe() {
    const filtered = useSidebarConfig(navGroups)
    const encoded = Buffer.from(JSON.stringify(filtered)).toString('base64')
    return <pre>{encoded}</pre>
  }

  const html = renderToStaticMarkup(<Probe />)
  const encoded = html.replace(/^<pre>/, '').replace(/<\/pre>$/, '')
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
}

test('keeps the user subscription entry visible for legacy admin sidebar configs', () => {
  sidebarModulesAdmin = JSON.stringify({
    chat: {
      enabled: true,
      playground: true,
      chat: true,
    },
    console: {
      enabled: true,
      detail: true,
      token: true,
      log: true,
      midjourney: true,
      task: true,
    },
    personal: {
      enabled: true,
      topup: true,
      personal: true,
    },
  })

  const filtered = renderFilteredNavGroups([
    {
      id: 'general',
      title: 'General',
      items: [
        { title: 'Wallet', url: '/wallet' },
        { title: 'My Subscriptions', url: '/my-subscriptions' },
        { title: 'Profile', url: '/profile' },
      ],
    },
  ])

  expect(filtered[0].items.map((item) => item.title)).toEqual([
    'Wallet',
    'My Subscriptions',
    'Profile',
  ])
})

test('hides the user subscription entry when admin disables it explicitly', () => {
  sidebarModulesAdmin = JSON.stringify({
    personal: {
      enabled: true,
      topup: true,
      personal: true,
      subscription: false,
    },
  })

  const filtered = renderFilteredNavGroups([
    {
      id: 'general',
      title: 'General',
      items: [
        { title: 'Wallet', url: '/wallet' },
        { title: 'My Subscriptions', url: '/my-subscriptions' },
        { title: 'Profile', url: '/profile' },
      ],
    },
  ])

  expect(filtered[0].items.map((item) => item.title)).toEqual([
    'Wallet',
    'Profile',
  ])
})

test('hides the admin token management entry when admin disables it explicitly', () => {
  sidebarModulesAdmin = JSON.stringify({
    admin: {
      enabled: true,
      channel: true,
      admin_token: false,
      models: true,
      redemption: true,
      user: true,
      setting: true,
      subscription: true,
    },
  })

  const filtered = renderFilteredNavGroups([
    {
      id: 'admin',
      title: 'Admin',
      items: [
        { title: 'Channels', url: '/channels' },
        { title: 'Token Management', url: '/admin-tokens' },
        { title: 'Users', url: '/users' },
      ],
    },
  ])

  expect(filtered[0].items.map((item) => item.title)).toEqual([
    'Channels',
    'Users',
  ])
})
