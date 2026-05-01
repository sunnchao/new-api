import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const breakdownPath = join(
  import.meta.dir,
  '../../src/features/pricing/components/dynamic-pricing-breakdown.tsx'
)

test('describes token group and fixed price request rules', () => {
  const source = readFileSync(breakdownPath, 'utf8')

  expect(source).toContain('SOURCE_TOKEN_GROUP')
  expect(source).toContain('cond.source === SOURCE_TOKEN_GROUP')
  expect(source).toContain('REQUEST_RULE_ACTION_FIXED')
  expect(source).toContain("t('Request pricing rules')")
  expect(source).toContain('group.fixedPrice')
})
