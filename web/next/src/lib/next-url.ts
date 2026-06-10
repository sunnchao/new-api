type SearchParamsLike = {
  get: (name: string) => string | null
  getAll: (name: string) => string[]
  forEach: (callback: (value: string, key: string) => void) => void
  toString: () => string
}

type SearchValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | null
  | undefined

export type SearchRecord = Record<string, SearchValue>

export function getSearchParam(
  searchParams: SearchParamsLike,
  key: string
): string | undefined {
  return searchParams.get(key) ?? undefined
}

export function getBooleanSearchParam(
  searchParams: SearchParamsLike,
  key: string
): boolean {
  const value = searchParams.get(key)
  return value === 'true' || value === '1'
}

export function searchParamsToRecord(
  searchParams: SearchParamsLike
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {}
  searchParams.forEach((_value, key) => {
    if (Object.prototype.hasOwnProperty.call(record, key)) return
    const values = searchParams.getAll(key)
    record[key] = values.length > 1 ? values : values[0] ?? ''
  })
  return record
}

export function searchParamsToApiRecord(
  searchParams: SearchParamsLike
): Record<string, unknown> {
  return searchParamsToRecord(searchParams)
}

export function createUrl(pathname: string, search?: SearchRecord): string {
  const params = new URLSearchParams()

  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          params.append(key, String(item))
        }
      })
      return
    }
    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function createUrlFromSearchParams(
  pathname: string,
  searchParams: SearchParamsLike,
  updates: SearchRecord = {}
): string {
  const params = new URLSearchParams(searchParams.toString())

  Object.entries(updates).forEach(([key, value]) => {
    params.delete(key)
    if (value === undefined || value === null || value === '' || value === false) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          params.append(key, String(item))
        }
      })
      return
    }
    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
