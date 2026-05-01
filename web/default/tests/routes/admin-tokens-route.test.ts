import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const routeTreePath = join(import.meta.dir, '../../src/routeTree.gen.ts')

test('registers the admin token management route', () => {
  const routeTree = readFileSync(routeTreePath, 'utf8')

  expect(routeTree).toContain('/admin-tokens')
  expect(routeTree).toContain(
    './routes/_authenticated/admin-tokens/index'
  )
})
