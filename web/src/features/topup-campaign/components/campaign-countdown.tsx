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
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { useCountdown } from '../hooks/use-countdown'
import { formatClock, padTwo } from '../lib/campaign'

interface CampaignCountdownProps {
  targetUnix: number
  serverTime: number
  variant?: 'blocks' | 'compact'
  className?: string
}

export function CampaignCountdown(props: CampaignCountdownProps) {
  const { t } = useTranslation()
  const parts = useCountdown(props.targetUnix, props.serverTime)

  if (parts.expired) {
    return (
      <span className={cn('text-muted-foreground text-sm', props.className)}>
        {t('Campaign ended')}
      </span>
    )
  }

  if (props.variant === 'compact') {
    return (
      <span
        className={cn(
          'text-sm font-semibold tabular-nums whitespace-nowrap',
          props.className
        )}
      >
        {parts.days > 0
          ? t('{{days}}d {{clock}}', {
              days: parts.days,
              clock: formatClock(parts),
            })
          : formatClock(parts)}
      </span>
    )
  }

  const items = [
    { id: 'days', value: String(parts.days), label: t('Days') },
    { id: 'hours', value: padTwo(parts.hours), label: t('Hours') },
    { id: 'minutes', value: padTwo(parts.minutes), label: t('Minutes') },
    { id: 'seconds', value: padTwo(parts.seconds), label: t('Seconds') },
  ]

  return (
    <div className={cn('flex gap-2', props.className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className='bg-background/70 min-w-14 rounded-xl border px-2 py-1.5 text-center backdrop-blur'
        >
          <div className='text-lg leading-tight font-semibold tabular-nums'>
            {item.value}
          </div>
          <div className='text-muted-foreground mt-0.5 text-[10px] tracking-wide uppercase'>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
