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
import { useQuery } from '@tanstack/react-query'
import {
  useSystemConfigStore,
  type CurrencyConfig,
  type QuotaDisplayType,
} from '@/stores/system-config-store'
import { getStatus } from '@/lib/api'
import type { SystemStatus } from '@/features/auth/types'

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function isQuotaDisplayType(value: unknown): value is QuotaDisplayType {
  return value === 'USD' || value === 'CNY' || value === 'TOKENS' || value === 'CUSTOM'
}

function mapStatusDataToConfig(data: SystemStatus | undefined) {
  if (!data) return {}

  const currency: CurrencyConfig = {
    displayInCurrency:
      data.display_in_currency ??
      useSystemConfigStore.getState().config.currency.displayInCurrency,
    quotaDisplayType: isQuotaDisplayType(data.quota_display_type)
      ? data.quota_display_type
      : useSystemConfigStore.getState().config.currency.quotaDisplayType,
    quotaPerUnit: toNumber(
      data.quota_per_unit,
      useSystemConfigStore.getState().config.currency.quotaPerUnit
    ),
    usdExchangeRate: toNumber(
      data.usd_exchange_rate,
      useSystemConfigStore.getState().config.currency.usdExchangeRate
    ),
    customCurrencySymbol:
      data.custom_currency_symbol?.trim() ||
      useSystemConfigStore.getState().config.currency.customCurrencySymbol,
    customCurrencyExchangeRate: toNumber(
      data.custom_currency_exchange_rate,
      useSystemConfigStore.getState().config.currency.customCurrencyExchangeRate ?? 1
    ),
  }

  return {
    systemName: data.system_name,
    logo: data.logo,
    footerHtml:
      typeof data.footer_html === 'string' ? data.footer_html : undefined,
    demoSiteEnabled: data.demo_site_enabled,
    displayTokenStatEnabled: data.display_token_stat_enabled,
    currency,
  }
}

export function useStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const status = await getStatus()
      try {
        if (status) {
          const { setConfig } = useSystemConfigStore.getState()
          setConfig(mapStatusDataToConfig(status))
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(
            '[useStatus] Failed to sync status to system config',
            err
          )
        }
      }
      // Save to localStorage
      try {
        if (typeof window !== 'undefined' && status) {
          window.localStorage.setItem('status', JSON.stringify(status))
        }
      } catch {
        /* empty */
      }
      return status as SystemStatus | null
    },
    // Data becomes stale after 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache expires after 30 minutes
    gcTime: 30 * 60 * 1000,
  })

  return {
    status: data ?? null,
    loading: isLoading,
    error,
  }
}
