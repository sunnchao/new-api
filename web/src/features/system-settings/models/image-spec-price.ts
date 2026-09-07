/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { safeJsonParse } from '../utils/json-parser'
import { formatPricingNumber } from './pricing-format'

export type ImageSpecPriceMap = Record<string, Record<string, number>>

export type ImageSpecPriceRow = {
  id: number
  key: string
  price: string
}

export type ImageSpecPriceParseResult =
  | { ok: true; specs: Record<string, number> }
  | { ok: false; messageKey: string }

export function parseImageSpecPriceMap(raw: string): ImageSpecPriceMap {
  const parsed = safeJsonParse<unknown>(raw, {
    fallback: {},
    silent: true,
    context: 'image spec prices',
  })
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }

  const result: ImageSpecPriceMap = {}
  for (const [model, specs] of Object.entries(
    parsed as Record<string, unknown>
  )) {
    if (!model || !specs || typeof specs !== 'object' || Array.isArray(specs)) {
      continue
    }
    const modelSpecs: Record<string, number> = {}
    for (const [spec, price] of Object.entries(
      specs as Record<string, unknown>
    )) {
      if (
        typeof price === 'number' &&
        Number.isFinite(price) &&
        price >= 0 &&
        spec.trim() !== ''
      ) {
        modelSpecs[spec] = price
      }
    }
    if (Object.keys(modelSpecs).length > 0) {
      result[model] = modelSpecs
    }
  }
  return result
}

export function imageSpecPriceToRows(
  specs?: Record<string, number>
): ImageSpecPriceRow[] {
  if (!specs) return []
  return Object.entries(specs).map(([key, price], index) => ({
    id: index + 1,
    key,
    price: formatPricingNumber(price),
  }))
}

export function parseImageSpecPriceRows(
  rows: ImageSpecPriceRow[]
): ImageSpecPriceParseResult {
  const specs: Record<string, number> = {}
  const seen = new Set<string>()

  for (const row of rows) {
    const key = row.key.trim().toLowerCase()
    const priceText = row.price.trim()
    if (!key && priceText === '') continue
    if (!key) {
      return { ok: false, messageKey: 'Spec key is required' }
    }
    if (seen.has(key)) {
      return { ok: false, messageKey: 'Duplicate spec key' }
    }
    seen.add(key)
    const price = Number(priceText)
    if (priceText === '' || !Number.isFinite(price) || price < 0) {
      return {
        ok: false,
        messageKey: 'Image spec price must be finite and non-negative',
      }
    }
    specs[key] = price
  }

  return { ok: true, specs }
}

export function hasImageSpecPrices(specs?: Record<string, number>) {
  return Boolean(specs && Object.keys(specs).length > 0)
}

export function upsertModelImageSpecPrices(
  raw: string,
  modelNames: string[],
  specs?: Record<string, number>
): string {
  const next = parseImageSpecPriceMap(raw)
  const hasSpecs = hasImageSpecPrices(specs)
  for (const name of modelNames) {
    if (!hasSpecs) {
      delete next[name]
    } else if (specs) {
      next[name] = { ...specs }
    }
  }
  return JSON.stringify(next, null, 2)
}
