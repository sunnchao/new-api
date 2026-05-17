import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseHeaderNavModules,
  parseHeaderNavModulesFromStatus,
} from '../../src/lib/nav-modules'
import {
  HEADER_NAV_DEFAULT,
  parseHeaderNavModules as parseMaintenanceHeaderNavModules,
  serializeHeaderNavModules,
} from '../../src/features/system-settings/maintenance/config'

const routeTreePath = join(import.meta.dir, '../../src/routeTree.gen.ts')

test('registers the public contact route', () => {
  const routeTree = readFileSync(routeTreePath, 'utf8')

  expect(routeTree).toContain('/contact/')
  expect(routeTree).toContain('./routes/contact/index')
})

test('enables contact in the public header navigation by default', () => {
  expect(parseHeaderNavModules(undefined).contact).toBe(true)
  expect(parseHeaderNavModulesFromStatus(null).contact).toBe(true)
  expect(parseHeaderNavModules(JSON.stringify({ contact: false })).contact).toBe(
    false
  )
})

test('keeps contact configurable in header navigation settings', () => {
  expect(HEADER_NAV_DEFAULT.contact).toBe(true)
  expect(parseMaintenanceHeaderNavModules(undefined).contact).toBe(true)
  expect(
    parseMaintenanceHeaderNavModules(JSON.stringify({ contact: false })).contact
  ).toBe(false)

  const serialized = serializeHeaderNavModules({
    ...HEADER_NAV_DEFAULT,
    contact: false,
  })

  expect(JSON.parse(serialized).contact).toBe(false)
})
