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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { testChannel } from '@/features/channels/api'
import { formatLatency } from '../hooks/use-health-data'
import type { ChannelHealth } from '../types'

interface ChannelHealthPanelProps {
  channels: ChannelHealth[]
}

function channelStatusBadge(
  status: number,
  t: (k: string) => string
): React.ReactElement {
  if (status === 1) {
    return <Badge variant="success">{t('health.channel.enabled')}</Badge>
  }
  if (status === 2) {
    return <Badge variant="warning">{t('health.channel.autoDisabled')}</Badge>
  }
  return <Badge variant="destructive">{t('health.channel.disabled')}</Badge>
}

function responseTimeBadge(rt: number): React.ReactElement {
  if (!rt || rt === 0) {
    return <Badge variant="secondary">-</Badge>
  }
  const variant: 'success' | 'warning' | 'destructive' =
    rt <= 1000 ? 'success' : rt <= 3000 ? 'warning' : 'destructive'
  return <Badge variant={variant}>{formatLatency(rt)}</Badge>
}

export function ChannelHealthPanel({ channels }: ChannelHealthPanelProps) {
  const { t } = useTranslation()
  const [testingIds, setTestingIds] = useState<Set<number>>(new Set())

  const runTest = async (channel: ChannelHealth) => {
    const id = channel.id
    setTestingIds((prev) => new Set(prev).add(id))
    try {
      const res = await testChannel(id)
      if (res.success) {
        toast.success(
          t('health.channel.testPassed', {
            latency: formatLatency(res.data?.response_time ?? 0),
          })
        )
      } else {
        toast.error(res.message || t('health.channel.testFailed'))
      }
    } catch {
      toast.error(t('health.channel.testFailed'))
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (channels.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-[var(--muted)]">
        {t('health.channel.noChannels')}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/40">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('health.channel.name')}</TableHead>
            <TableHead className="w-24">{t('health.channel.status')}</TableHead>
            <TableHead className="w-28">
              {t('health.channel.responseTime')}
            </TableHead>
            <TableHead className="w-20">{t('health.channel.priority')}</TableHead>
            <TableHead className="w-20">{t('health.channel.weight')}</TableHead>
            <TableHead className="w-40">{t('health.channel.lastCheck')}</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.map((ch) => (
            <TableRow key={ch.id}>
              <TableCell className="font-medium">{ch.name || '-'}</TableCell>
              <TableCell>{channelStatusBadge(ch.status, t)}</TableCell>
              <TableCell>{responseTimeBadge(ch.responseTime)}</TableCell>
              <TableCell className="font-mono text-xs">
                {ch.priority ?? '-'}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {ch.weight ?? '-'}
              </TableCell>
              <TableCell className="text-xs text-[var(--muted)]">
                {ch.testTime
                  ? dayjs(ch.testTime * 1000).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={testingIds.has(ch.id)}
                  onClick={() => runTest(ch)}
                >
                  {testingIds.has(ch.id)
                    ? t('health.channel.testing')
                    : t('health.channel.test')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
