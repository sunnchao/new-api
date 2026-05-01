import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const modelDetailsPath = join(
  import.meta.dir,
  '../../src/features/pricing/components/model-details.tsx'
)
const groupPricingSectionPath = join(
  import.meta.dir,
  '../../src/features/pricing/components/group-pricing-section.tsx'
)

test('keeps model details group pricing in an external component', () => {
  const modelDetailsSource = readFileSync(modelDetailsPath, 'utf8')
  const groupPricingSectionSource = readFileSync(groupPricingSectionPath, 'utf8')

  expect(modelDetailsSource).toContain("from './group-pricing-section'")
  expect(modelDetailsSource).not.toContain('function GroupPricingSection')
  expect(groupPricingSectionSource).toContain('getGroupPriceDisplay')
})
