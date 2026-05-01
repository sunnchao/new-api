import { type TFunction } from 'i18next'

// ============================================================================
// Duration Unit Options
// ============================================================================

export const DURATION_UNITS = [
  { value: 'year', labelKey: 'years' },
  { value: 'month', labelKey: 'months' },
  { value: 'day', labelKey: 'days' },
  { value: 'hour', labelKey: 'hours' },
  { value: 'custom', labelKey: 'Custom (seconds)' },
] as const

export const RESET_PERIODS = [
  { value: 'never', labelKey: 'No Reset' },
  { value: 'daily', labelKey: 'Daily' },
  { value: 'weekly', labelKey: 'Weekly' },
  { value: 'monthly', labelKey: 'Monthly' },
  { value: 'custom', labelKey: 'Custom (seconds)' },
] as const

export function getDurationUnitOptions(t: TFunction) {
  return DURATION_UNITS.map((u) => ({ value: u.value, label: t(u.labelKey) }))
}

export function getResetPeriodOptions(t: TFunction) {
  return RESET_PERIODS.map((p) => ({ value: p.value, label: t(p.labelKey) }))
}

// ============================================================================
// Billing Mode Options
// ============================================================================

export const BILLING_MODES = [
  { value: 'quota', labelKey: 'Quota-based' },
  { value: 'request', labelKey: 'Request-based' },
] as const

export function getBillingModeOptions(t: TFunction) {
  return BILLING_MODES.map((m) => ({ value: m.value, label: t(m.labelKey) }))
}

// ============================================================================
// Reset Mode Options (anchor vs natural calendar)
// ============================================================================

export const RESET_MODES = [
  { value: 'anchor', labelKey: 'Anchor' },
  { value: 'natural', labelKey: 'Natural Calendar' },
] as const

export function getResetModeOptions(t: TFunction) {
  return RESET_MODES.map((m) => ({ value: m.value, label: t(m.labelKey) }))
}
