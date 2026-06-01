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

import { useTranslation } from 'react-i18next'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { HealthStats } from '../types'

interface StatCardDef {
  key: keyof HealthStats
  labelKey: string
  icon: LucideIcon
  iconClass: string
  bgClass: string
}

const STAT_CARDS: StatCardDef[] = [
  {
    key: 'total',
    labelKey: 'health.stats.totalModels',
    icon: Activity,
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-500/10',
  },
  {
    key: 'healthy',
    labelKey: 'health.stats.healthy',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-500/10',
  },
  {
    key: 'degraded',
    labelKey: 'health.stats.degraded',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-500/10',
  },
  {
    key: 'offline',
    labelKey: 'health.stats.offline',
    icon: XCircle,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-500/10',
  },
  {
    key: 'unknown',
    labelKey: 'health.stats.unknown',
    icon: HelpCircle,
    iconClass: 'text-gray-500',
    bgClass: 'bg-gray-500/10',
  },
]

interface StatCardsProps {
  stats: HealthStats
}

export function StatCards({ stats }: StatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.key} className="p-4">
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${card.iconClass}`}>
                {stats[card.key]}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgClass}`}
              >
                <Icon className={`h-4 w-4 ${card.iconClass}`} />
              </div>
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {t(card.labelKey)}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
