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

import { getChannels } from '@/features/channels/api'
import type { Channel } from '@/features/channels/types'
import { getModels } from '@/features/models/api'
import type { Model } from '@/features/models/types'
import { getPerfMetrics } from '@/features/performance-metrics/api'
import type { PerformanceMetricsData } from '@/features/performance-metrics/types'

/**
 * Fetch all models. Health is derived from model -> bound channel data, so we
 * pull the full list in one page.
 */
export async function getAllHealthModels(): Promise<Model[]> {
  const res = await getModels({ p: 0, page_size: 9999 })
  return res.data?.items ?? []
}

/**
 * Fetch every channel (single large page) so we can map bound channels to
 * their live status/response-time fields.
 */
export async function getAllHealthChannels(): Promise<Channel[]> {
  const res = await getChannels({ p: 0, page_size: 9999 })
  return res.data?.items ?? []
}

/**
 * Performance trend detail for a single model (re-exported for the trend chart).
 */
export async function getModelPerfDetail(
  modelName: string,
  hours = 24
): Promise<PerformanceMetricsData> {
  return getPerfMetrics(modelName, hours)
}
