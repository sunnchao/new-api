import { expect, mock, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

mock.module('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

mock.module('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

mock.module('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    systemName: 'Demo Gateway',
    logo: '/logo.png',
    loading: false,
  }),
}))

const { AuthLayout } = await import('../../src/features/auth/auth-layout')

test('auth layout renders decorative motion background behind auth content', () => {
  const html = renderToStaticMarkup(
    <AuthLayout>
      <button>Continue</button>
    </AuthLayout>
  )

  expect(html).toContain('data-testid="auth-motion-background"')
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain('z-20')
  expect(html).toContain('href="/"')
  expect(html).toContain('Demo Gateway')
  expect(html).toContain('Continue')
})
