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

'use client'

import './i18n'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'
import { HeartPulse, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useIsAdmin } from '@/hooks'
import { useHealthData } from './hooks/use-health-data'
import { StatCards } from './components/stat-cards'
import { ModelHealthTable } from './components/model-health-table'

const AUTO_REFRESH_MS = 30000

// Charts pull in recharts — load lazily so the dashboard shell paints first.
const PerfTrendCharts = dynamic(
  () =>
    import('./components/perf-trend-charts').then((m) => ({
      default: m.PerfTrendCharts,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    ),
  }
)

export function HealthDashboardPage() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { stats, modelHealthList, loading, isFetching, refetch } = useHealthData({
    autoRefresh,
    refreshInterval: AUTO_REFRESH_MS,
  })

  if (!isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
        {t('health.dashboard.adminOnly')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold">{t('health.dashboard.title')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>{t('health.dashboard.autoRefresh')}</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </label>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            {t('health.dashboard.refresh')}
          </Button>
        </div>
      </div>

      <StatCards stats={stats} />

      <ModelHealthTable data={modelHealthList} loading={loading} />

      <PerfTrendCharts
        hours={24}
        refreshInterval={autoRefresh ? AUTO_REFRESH_MS : 0}
      />
    </div>
  )
}

export default HealthDashboardPage
