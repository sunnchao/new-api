export function isAllowedSection<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

export function coerceSection<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return isAllowedSection(value, allowed) ? value : fallback;
}
