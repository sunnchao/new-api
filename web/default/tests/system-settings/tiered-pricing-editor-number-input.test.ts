import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const editorPath = join(
  import.meta.dir,
  '../../src/features/system-settings/models/tiered-pricing-editor.tsx'
)

test('allows decimal values in tiered pricing number inputs', () => {
  const source = readFileSync(editorPath, 'utf8')

  expect(source).toContain("step='any'")
})
