import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const editorPath = join(
  import.meta.dir,
  '../../src/features/system-settings/models/tiered-pricing-editor.tsx'
)

function findButtonOpeningTags(source: string): string[] {
  const tags: string[] = []
  let cursor = 0

  while (cursor < source.length) {
    const start = source.indexOf('<Button', cursor)
    if (start === -1) break

    let index = start
    let braceDepth = 0
    let quote: "'" | '"' | '`' | null = null

    while (index < source.length) {
      const char = source[index]
      const previous = source[index - 1]

      if (quote) {
        if (char === quote && previous !== '\\') quote = null
        index++
        continue
      }

      if (char === "'" || char === '"' || char === '`') {
        quote = char
      } else if (char === '{') {
        braceDepth++
      } else if (char === '}') {
        braceDepth = Math.max(0, braceDepth - 1)
      } else if (char === '>' && braceDepth === 0) {
        tags.push(source.slice(start, index + 1))
        cursor = index + 1
        break
      }

      index++
    }
  }

  return tags
}

test('marks tiered pricing editor action buttons as non-submit buttons', () => {
  const source = readFileSync(editorPath, 'utf8')
  const buttonTags = findButtonOpeningTags(source)

  expect(buttonTags.length).toBeGreaterThan(0)
  expect(
    buttonTags.filter((tag) => !/\btype=(['"])button\1/.test(tag))
  ).toEqual([])
})
