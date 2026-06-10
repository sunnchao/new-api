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

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'

interface TrendPoint {
  label: string
  latency: number | null
  successRate: number | null
}

export interface PerfTrendChartsProps {
  /** Trailing window in hours (defaults to 24). */
  hours?: number
  /** Refresh cadence in ms (0 / undefined disables auto-refresh). */
  refreshInterval?: number
}

export function PerfTrendCharts({
  hours = 24,
  refreshInterval,
}: PerfTrendChartsProps) {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['health', 'perf-trend', hours],
    queryFn: () => getPerfMetricsSummary(hours),
    refetchInterval: refreshInterval && refreshInterval > 0 ? refreshInterval : false,
  })

  const points = useMemo<TrendPoint[]>(() => {
    const models = query.data?.data?.models ?? []
    return models.slice(0, 10).map((model) => {
      return {
        label:
          model.model_name.length > 20
            ? `${model.model_name.slice(0, 17)}...`
            : model.model_name,
        latency:
          model.avg_latency_ms > 0 ? Math.round(model.avg_latency_ms) : null,
        successRate: Number.isFinite(model.success_rate)
          ? Math.round(model.success_rate * 100) / 100
          : null,
      }
    })
  }, [query.data])

  const tooltipStyle = {
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: 12,
  } as const

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t('health.trend.latencyTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : points.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-[var(--border)] text-xs text-[var(--muted)]">
              {t('health.trend.noLatencyData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  tickFormatter={(v: number) => `${v}ms`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => {
                    const numeric = typeof value === 'number' ? value : Number(value ?? 0)
                    return [`${numeric} ms`, t('health.trend.ttft')]
                  }}
                />
                <Bar
                  dataKey="latency"
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                  name={t('health.trend.ttft')}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t('health.trend.availabilityTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : points.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-[var(--border)] text-xs text-[var(--muted)]">
              {t('health.trend.noAvailabilityData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[95, 100]}
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => {
                    const numeric = typeof value === 'number' ? value : Number(value ?? 0)
                    return [
                      `${numeric.toFixed(2)}%`,
                      t('health.trend.successRate'),
                    ]
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                  name={t('health.trend.successRate')}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
