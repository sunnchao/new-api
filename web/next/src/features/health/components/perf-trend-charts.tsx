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
  Area,
  AreaChart,
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
import { getModelPerfDetail } from '../api'

function formatHourLabel(ts: number): string {
  const d = new Date(ts * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

interface TrendPoint {
  label: string
  ttft: number | null
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
    // Empty model name aggregates across all models on the backend.
    queryFn: () => getModelPerfDetail('', hours),
    refetchInterval: refreshInterval && refreshInterval > 0 ? refreshInterval : false,
  })

  const points = useMemo<TrendPoint[]>(() => {
    const groups = query.data?.data?.groups ?? []
    if (groups.length === 0) return []

    // Aggregate every series point across all model groups by timestamp.
    const ttftByTs = new Map<number, number[]>()
    const successByTs = new Map<number, number[]>()
    for (const group of groups) {
      for (const point of group.series ?? []) {
        if (point.avg_ttft_ms > 0) {
          const bucket = ttftByTs.get(point.ts) ?? []
          bucket.push(point.avg_ttft_ms)
          ttftByTs.set(point.ts, bucket)
        }
        if (Number.isFinite(point.success_rate)) {
          const bucket = successByTs.get(point.ts) ?? []
          bucket.push(point.success_rate)
          successByTs.set(point.ts, bucket)
        }
      }
    }

    const allTs = new Set<number>([
      ...ttftByTs.keys(),
      ...successByTs.keys(),
    ])
    const sortedTs = Array.from(allTs).sort((a, b) => a - b)

    const avg = (vals: number[] | undefined): number | null => {
      if (!vals || vals.length === 0) return null
      return vals.reduce((s, v) => s + v, 0) / vals.length
    }

    return sortedTs.map((ts) => {
      const ttft = avg(ttftByTs.get(ts))
      const rate = avg(successByTs.get(ts))
      return {
        label: formatHourLabel(ts),
        ttft: ttft == null ? null : Math.round(ttft),
        successRate: rate == null ? null : Math.round(rate * 100) / 100,
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
              <AreaChart data={points}>
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
                  formatter={(value: number) => [`${value} ms`, t('health.trend.ttft')]}
                />
                <Area
                  type="monotone"
                  dataKey="ttft"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.08}
                  strokeWidth={2}
                  connectNulls
                  name={t('health.trend.ttft')}
                />
              </AreaChart>
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
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    t('health.trend.successRate'),
                  ]}
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
