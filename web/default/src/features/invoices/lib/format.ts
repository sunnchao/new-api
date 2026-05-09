import type { InvoiceStatus, InvoiceType, RealNameStatus } from '../types'
import { formatBillingCurrencyFromUSD } from '@/lib/currency'

export function formatInvoiceMoney(amount: number, currency = 'USD') {
  if (currency === 'USD') {
    return formatBillingCurrencyFromUSD(amount, {
      digitsLarge: 2,
      digitsSmall: 2,
      abbreviate: false,
    })
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatUnixTime(timestamp?: number) {
  if (!timestamp) return '-'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

export function getInvoiceTypeLabelKey(type: InvoiceType) {
  return type === 'company' ? 'Company invoice' : 'Personal invoice'
}

export function getInvoiceStatusLabelKey(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    pending: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
    issued: 'Issued',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

export function getInvoiceStatusVariant(status: InvoiceStatus) {
  const variants = {
    pending: 'warning',
    approved: 'info',
    rejected: 'danger',
    issued: 'success',
    cancelled: 'neutral',
  } as const
  return variants[status] ?? 'neutral'
}

export function getRealNameStatusLabelKey(status?: RealNameStatus) {
  if (!status) return 'Unverified'
  const labels: Record<RealNameStatus, string> = {
    unverified: 'Unverified',
    pending: 'Verification pending',
    verified: 'Verified',
    failed: 'Verification failed',
    expired: 'Verification expired',
  }
  return labels[status] ?? status
}

export function getRealNameStatusVariant(status?: RealNameStatus) {
  if (!status) return 'neutral'
  const variants = {
    unverified: 'neutral',
    pending: 'warning',
    verified: 'success',
    failed: 'danger',
    expired: 'neutral',
  } as const
  return variants[status] ?? 'neutral'
}

export function sumSelectedTopUps<T extends { money: number }>(items: T[]) {
  return items.reduce((sum, item) => sum + item.money, 0)
}

export const INVOICE_CONFIRM_PHRASE = '确认开具发票'
