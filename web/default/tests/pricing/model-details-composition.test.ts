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
const dynamicGroupPricingSectionPath = join(
  import.meta.dir,
  '../../src/features/pricing/components/dynamic-group-pricing-section.tsx'
)

test('keeps model details group pricing local and moves dynamic request rows out', () => {
  const modelDetailsSource = readFileSync(modelDetailsPath, 'utf8')
  const groupPricingSectionSource = readFileSync(groupPricingSectionPath, 'utf8')
  const dynamicGroupPricingSectionSource = readFileSync(
    dynamicGroupPricingSectionPath,
    'utf8'
  )

  expect(modelDetailsSource).toContain('function GroupPricingSection')
  expect(modelDetailsSource).toContain('availableGroups.map((group) =>')
  expect(modelDetailsSource).toContain(
    "groupPriceRow?.billingType === 'request'"
  )
  expect(modelDetailsSource).toContain('row={groupPriceRow}')
  expect(modelDetailsSource).not.toContain('rows={[groupPriceRow]}')
  expect(modelDetailsSource).not.toContain('tokenDynamicGroups')
  expect(groupPricingSectionSource).toContain('getGroupPriceDisplay')
  expect(groupPricingSectionSource).not.toContain(
    'function DynamicRequestGroupPricingTable'
  )
  expect(modelDetailsSource).toContain('DynamicRequestGroupPricingSection')
  expect(dynamicGroupPricingSectionSource).toContain(
    'export function DynamicRequestGroupPricingSection'
  )
  expect(dynamicGroupPricingSectionSource).toContain('row: GroupPriceDisplay')
  expect(dynamicGroupPricingSectionSource).toContain(
    "props.row.billingType !== 'request'"
  )
})
