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

// ============================================================================
// Health status (derived from channel/model data — no dedicated health API)
// ============================================================================

export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
} as const

export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS]

export interface HealthStatusMeta {
  color: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  labelKey: string
}

export const HEALTH_STATUS_META: Record<HealthStatus, HealthStatusMeta> = {
  [HEALTH_STATUS.HEALTHY]: {
    color: '#10b981',
    badgeVariant: 'success',
    labelKey: 'health.status.healthy',
  },
  [HEALTH_STATUS.DEGRADED]: {
    color: '#f59e0b',
    badgeVariant: 'warning',
    labelKey: 'health.status.degraded',
  },
  [HEALTH_STATUS.OFFLINE]: {
    color: '#ef4444',
    badgeVariant: 'destructive',
    labelKey: 'health.status.offline',
  },
  [HEALTH_STATUS.UNKNOWN]: {
    color: '#9ca3af',
    badgeVariant: 'secondary',
    labelKey: 'health.status.unknown',
  },
}

// ============================================================================
// Channel & model health shapes
// ============================================================================

/**
 * Health detail for an individual channel bound to a model.
 * Sourced from GET /api/channel/ items.
 */
export interface ChannelHealth {
  id: number
  name: string
  type: number
  /** 1: enabled, 0: manual disabled, 2: auto disabled */
  status: number
  /** response time in milliseconds (0 == not tested) */
  responseTime: number
  /** last test timestamp (unix seconds, 0 == never) */
  testTime: number
  priority: number | null
  weight: number | null
}

/**
 * Aggregated health for a single model, computed from its bound channels.
 */
export interface ModelHealth {
  key: string
  modelName: string
  vendorName: string
  status: HealthStatus
  totalChannels: number
  healthyChannels: number
  /** average response time in ms over tested channels (null when none tested) */
  avgLatency: number | null
  /** latest test timestamp across channels (unix seconds, 0 == never) */
  lastTested: number
  channels: ChannelHealth[]
}

/**
 * Top-level health summary counts.
 */
export interface HealthStats {
  total: number
  healthy: number
  degraded: number
  offline: number
  unknown: number
}
