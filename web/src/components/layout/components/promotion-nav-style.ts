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
import { cn } from '@/lib/utils'

import type { TopNavLink } from '../types'

export function promotionNavClassName(link: TopNavLink): string {
  const isPromotion = link.variant === 'promotion'
  return cn(
    'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
    isPromotion
      ? 'border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-orange-400/10 to-amber-400/10 text-rose-700 shadow-[0_6px_20px_-12px_rgba(225,29,72,0.9)] hover:border-rose-500/50 hover:from-rose-500/25 hover:via-orange-400/20 hover:to-amber-400/20 hover:shadow-[0_10px_24px_-12px_rgba(225,29,72,0.95)] dark:border-rose-400/30 dark:from-rose-500/20 dark:via-orange-400/10 dark:to-amber-400/10 dark:text-rose-300 dark:hover:border-rose-400/60 dark:hover:from-rose-500/30 dark:hover:to-amber-400/20'
      : 'hover:text-primary text-sm font-medium transition-colors',
    !link.isActive && !isPromotion && 'text-muted-foreground',
    link.disabled && 'pointer-events-none opacity-50'
  )
}
