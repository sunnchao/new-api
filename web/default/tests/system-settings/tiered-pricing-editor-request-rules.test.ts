import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const editorPath = join(
  import.meta.dir,
  '../../src/features/system-settings/models/tiered-pricing-editor.tsx'
)

test('passes available token groups into request rule condition rows', () => {
  const source = readFileSync(editorPath, 'utf8')

  expect(source).toContain("queryKey: ['request-rule-token-groups']")
  expect(source).toContain('tokenGroups={tokenGroups}')
})

test('renders request rule action controls for multiplier and fixed pricing', () => {
  const source = readFileSync(editorPath, 'utf8')

  expect(source).toContain(
    'value={group.actionType || REQUEST_RULE_ACTION_MULTIPLIER}'
  )
  expect(source).toContain('value={REQUEST_RULE_ACTION_FIXED}')
  expect(source).toContain('fixedPrice: event.target.value')
  expect(source).toContain(
    "t('Final cost = fixed price per request when conditions match')"
  )
})
