import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const publicHeaderPath = join(
  import.meta.dir,
  '../../src/components/layout/components/public-header.tsx'
)

test('keeps the compact public header wide enough for the full navigation', () => {
  const source = readFileSync(publicHeaderPath, 'utf8')

  expect(source).toContain("scrolled ? 'max-w-[68rem] px-3 pt-3'")
  expect(source).toContain('px-2.5 py-1.5')
  expect(source).toContain('whitespace-nowrap')
})

test('adds a layered shadow to the compact public header', () => {
  const source = readFileSync(publicHeaderPath, 'utf8')

  expect(source).toContain(
    'shadow-[0_18px_48px_-28px_rgba(15,23,42,0.45)'
  )
  expect(source).toContain(
    'dark:shadow-[0_18px_52px_-28px_rgba(0,0,0,0.78)'
  )
})
