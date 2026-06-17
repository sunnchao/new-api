import { afterEach, expect, test } from 'bun:test'
import { createProxyHandler } from '../../functions/utils/proxy.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('edgeone proxy removes decoded response encoding metadata', async () => {
  let proxiedRequestHeaders: Headers | undefined
  globalThis.fetch = (async (_url, init) => {
    proxiedRequestHeaders = new Headers(init?.headers)

    return new Response('{"success":true}', {
      status: 200,
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Length': '128',
        'Content-Type': 'application/json; charset=utf-8',
        Vary: 'Accept-Encoding',
      },
    })
  }) as typeof fetch

  const response = await createProxyHandler({
    env: {
      TARGET_URL: 'https://backend.example',
      NODE_ENV: 'production',
      PROXY_FUNCTION_RUNTIME: 'edgeone',
    },
    request: new Request('https://edge.example/api/status', {
      headers: {
        'Accept-Encoding': 'gzip, br',
      },
    }),
  })

  expect(response.status).toBe(200)
  expect(proxiedRequestHeaders?.has('Accept-Encoding')).toBe(false)
  expect(response.headers.get('Content-Type')).toBe(
    'application/json; charset=utf-8'
  )
  expect(response.headers.has('Content-Encoding')).toBe(false)
  expect(response.headers.has('Content-Length')).toBe(false)
  expect(await response.text()).toBe('{"success":true}')
})

test('cloudflare proxy preserves response encoding metadata', async () => {
  let proxiedRequestHeaders: Headers | undefined
  globalThis.fetch = (async (_url, init) => {
    proxiedRequestHeaders = new Headers(init?.headers)

    return new Response('encoded-body', {
      status: 200,
      headers: {
        Connection: 'keep-alive',
        'Content-Encoding': 'gzip',
        'Content-Length': '128',
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  }) as typeof fetch

  const response = await createProxyHandler({
    env: {
      TARGET_URL: 'https://backend.example',
      NODE_ENV: 'production',
      PROXY_FUNCTION_RUNTIME: 'cloudflare',
    },
    request: new Request('https://cf.example/api/status', {
      headers: {
        'Accept-Encoding': 'gzip, br',
      },
    }),
  })

  expect(response.status).toBe(200)
  expect(proxiedRequestHeaders?.get('Accept-Encoding')).toBe('gzip, br')
  expect(response.headers.get('Content-Encoding')).toBe('gzip')
  expect(response.headers.get('Content-Length')).toBe('128')
  expect(response.headers.has('Connection')).toBe(false)
  expect(await response.text()).toBe('encoded-body')
})
