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
import { useQuery } from '@tanstack/react-query'
import type { Channel } from '@/features/channels/types'
import type { Model } from '@/features/models/types'
import { getAllHealthChannels, getAllHealthModels } from '../api'
import {
  HEALTH_STATUS,
  type ChannelHealth,
  type HealthStats,
  type HealthStatus,
  type ModelHealth,
} from '../types'

const AUTO_REFRESH_MS = 30000

// ============================================================================
// Derivation helpers (ported from web/classic health.constants.js)
// ============================================================================

/**
 * Derive model health from its bound channel set.
 * - no channels => unknown
 * - all channels disabled => offline
 * - some channels disabled => degraded
 * - all channels enabled => healthy
 */
export function deriveModelHealth(channels: ChannelHealth[]): HealthStatus {
  if (!channels || channels.length === 0) return HEALTH_STATUS.UNKNOWN
  const enabled = channels.filter((c) => c.status === 1)
  if (enabled.length === 0) return HEALTH_STATUS.OFFLINE
  if (enabled.length < channels.length) return HEALTH_STATUS.DEGRADED
  return HEALTH_STATUS.HEALTHY
}

/**
 * Average response time (ms) across channels that have been tested.
 */
export function deriveAvgLatency(channels: ChannelHealth[]): number | null {
  if (!channels || channels.length === 0) return null
  const tested = channels.filter((c) => c.responseTime > 0)
  if (tested.length === 0) return null
  const sum = tested.reduce((acc, c) => acc + c.responseTime, 0)
  return Math.round(sum / tested.length)
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ============================================================================
// Hook
// ============================================================================

interface UseHealthDataOptions {
  /** Enable periodic auto-refresh. */
  autoRefresh?: boolean
  /** Refresh cadence in ms (defaults to 30s). */
  refreshInterval?: number
}

interface UseHealthDataResult {
  stats: HealthStats
  modelHealthList: ModelHealth[]
  loading: boolean
  error: unknown
  refetch: () => void
  isFetching: boolean
}

function toChannelHealth(ch: Channel): ChannelHealth {
  return {
    id: ch.id,
    name: ch.name,
    type: ch.type,
    status: ch.status,
    responseTime: ch.response_time ?? 0,
    testTime: ch.test_time ?? 0,
    priority: ch.priority ?? null,
    weight: ch.weight ?? null,
  }
}

export function useHealthData(
  options: UseHealthDataOptions = {}
): UseHealthDataResult {
  const { autoRefresh = false, refreshInterval = AUTO_REFRESH_MS } = options

  const query = useQuery({
    queryKey: ['health', 'overview'],
    queryFn: async () => {
      const [models, channels] = await Promise.all([
        getAllHealthModels(),
        getAllHealthChannels(),
      ])
      return { models, channels }
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  })

  const models = useMemo<Model[]>(
    () => query.data?.models ?? [],
    [query.data]
  )
  const channels = useMemo<Channel[]>(
    () => query.data?.channels ?? [],
    [query.data]
  )

  const channelLookup = useMemo(() => {
    const byId = new Map<number, Channel>()
    const byNameAndType = new Map<string, Channel>()
    const byName = new Map<string, Channel[]>()
    for (const ch of channels) {
      byId.set(ch.id, ch)
      byNameAndType.set(`${ch.name}::${ch.type}`, ch)
      const sameName = byName.get(ch.name) ?? []
      sameName.push(ch)
      byName.set(ch.name, sameName)
    }
    return { byId, byNameAndType, byName }
  }, [channels])

  const findBoundChannel = useMemo(() => {
    return (bc: NonNullable<Model['bound_channels']>[number]) => {
      if (typeof bc.id === 'number') {
        const byId = channelLookup.byId.get(bc.id)
        if (byId) return byId
      }

      if (typeof bc.type === 'number') {
        const byType = channelLookup.byNameAndType.get(`${bc.name}::${bc.type}`)
        if (byType) return byType
      }

      const sameName = channelLookup.byName.get(bc.name) ?? []
      return sameName.length === 1 ? sameName[0] : null
    }
  }, [channelLookup])

  const modelHealthList = useMemo<ModelHealth[]>(() => {
    return models
      .filter((m) => m.bound_channels && m.bound_channels.length > 0)
      .map((model) => {
        const boundChannels: ChannelHealth[] = (model.bound_channels || [])
          .map((bc) => {
            const ch = findBoundChannel(bc)
            if (!ch) return null
            return toChannelHealth(ch)
          })
          .filter((c): c is ChannelHealth => c !== null)

        const healthyCount = boundChannels.filter((c) => c.status === 1).length
        const lastTested = boundChannels.reduce(
          (max, c) => Math.max(max, c.testTime || 0),
          0
        )

        return {
          key: String(model.id || model.model_name),
          modelName: model.model_name,
          vendorName: model.vendor_id ? String(model.vendor_id) : '-',
          status: deriveModelHealth(boundChannels),
          totalChannels: boundChannels.length,
          healthyChannels: healthyCount,
          avgLatency: deriveAvgLatency(boundChannels),
          lastTested,
          channels: boundChannels,
        }
      })
  }, [models, findBoundChannel])

  const stats = useMemo<HealthStats>(() => {
    const unknown = models.filter(
      (m) => !m.bound_channels || m.bound_channels.length === 0
    ).length
    const healthy = modelHealthList.filter(
      (m) => m.status === HEALTH_STATUS.HEALTHY
    ).length
    const degraded = modelHealthList.filter(
      (m) => m.status === HEALTH_STATUS.DEGRADED
    ).length
    const offline = modelHealthList.filter(
      (m) => m.status === HEALTH_STATUS.OFFLINE
    ).length
    const total = modelHealthList.length + unknown

    return { total, healthy, degraded, offline, unknown }
  }, [modelHealthList, models])

  return {
    stats,
    modelHealthList,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}
