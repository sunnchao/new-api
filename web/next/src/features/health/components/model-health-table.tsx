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

import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatLatency } from '../hooks/use-health-data'
import {
  HEALTH_STATUS,
  HEALTH_STATUS_META,
  type HealthStatus,
  type ModelHealth,
} from '../types'
import { ChannelHealthPanel } from './channel-health-panel'

type SortKey = 'name' | 'status'

const STATUS_ORDER: Record<HealthStatus, number> = {
  [HEALTH_STATUS.OFFLINE]: 0,
  [HEALTH_STATUS.DEGRADED]: 1,
  [HEALTH_STATUS.HEALTHY]: 2,
  [HEALTH_STATUS.UNKNOWN]: 3,
}

interface ModelHealthTableProps {
  data: ModelHealth[]
  loading: boolean
}

export function ModelHealthTable({ data, loading }: ModelHealthTableProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<HealthStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = data
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((m) => m.modelName.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter)
    }
    return [...result].sort((a, b) => {
      if (sortKey === 'name') return a.modelName.localeCompare(b.modelName)
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    })
  }, [data, search, statusFilter, sortKey])

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('health.table.searchModel')}
            className="h-8 w-56 pl-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as HealthStatus | 'all')}
        >
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder={t('health.table.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('health.table.allStatuses')}</SelectItem>
            {Object.values(HEALTH_STATUS).map((status) => (
              <SelectItem key={status} value={status}>
                {t(HEALTH_STATUS_META[status].labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">{t('health.table.sortByStatus')}</SelectItem>
            <SelectItem value="name">{t('health.table.sortByName')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>{t('health.table.modelName')}</TableHead>
            <TableHead className="w-28">{t('health.table.status')}</TableHead>
            <TableHead className="w-32">{t('health.table.channels')}</TableHead>
            <TableHead className="w-28">{t('health.table.avgLatency')}</TableHead>
            <TableHead className="w-40">{t('health.table.lastTested')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-sm text-[var(--muted)]"
              >
                {t('health.table.noData')}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((model) => {
              const isOpen = expanded.has(model.key)
              const meta = HEALTH_STATUS_META[model.status]
              return (
                <Fragment key={model.key}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggle(model.key)}
                  >
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        {model.modelName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.badgeVariant}>
                        {t(meta.labelKey)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {model.healthyChannels}/{model.totalChannels}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatLatency(model.avgLatency)}
                    </TableCell>
                    <TableCell className="text-xs text-[var(--muted)]">
                      {model.lastTested
                        ? dayjs(model.lastTested * 1000).format(
                            'YYYY-MM-DD HH:mm'
                          )
                        : '-'}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className={cn('p-2')}>
                        <ChannelHealthPanel channels={model.channels} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
