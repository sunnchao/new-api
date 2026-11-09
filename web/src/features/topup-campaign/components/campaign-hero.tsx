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
import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toIntlLocale } from '@/i18n/languages'
import { formatCurrencyFromUSD } from '@/lib/currency'

import {
  countdownTarget,
  formatBonusRate,
  formatCampaignDate,
  maxTierBonus,
} from '../lib/campaign'
import type { TopupCampaignInfo } from '../types'
import { CampaignCountdown } from './campaign-countdown'

function statusLabel(
  info: TopupCampaignInfo,
  t: (key: string) => string
): string {
  if (info.status === 'upcoming') return t('Campaign upcoming')
  if (info.status === 'day') return t('Bonus day')
  if (info.status === 'ended' || info.status === 'disabled') {
    return t('Campaign ended')
  }
  return t('Campaign live')
}

function countdownLabel(
  info: TopupCampaignInfo,
  t: (key: string) => string
): string {
  if (info.status === 'upcoming') return t('Starts in')
  if (info.status === 'day') return t('Bonus day · ends in')
  return t('Ends in')
}

export function CampaignHero(props: { info: TopupCampaignInfo }) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const maxBonus = formatCurrencyFromUSD(maxTierBonus(props.info.tiers), {
    locale,
    digitsLarge: 0,
    digitsSmall: 2,
  })
  const rate = formatBonusRate(props.info.day_bonus_rate, locale)
  const start = formatCampaignDate(props.info.start_time, locale)
  const end = formatCampaignDate(props.info.end_time, locale)
  const countdownText = countdownLabel(props.info, t)

  return (
    <section className='relative overflow-hidden rounded-3xl border bg-gradient-to-br from-rose-500/15 via-orange-400/10 to-amber-300/5 p-6 sm:p-10'>
      <div
        className='pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-rose-400/20 blur-3xl'
        aria-hidden='true'
      />
      <div
        className='pointer-events-none absolute -bottom-28 -left-10 size-56 rounded-full bg-amber-300/20 blur-3xl'
        aria-hidden='true'
      />

      <div className='relative flex flex-col gap-6'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary' className='gap-1'>
            <Sparkles className='size-3.5' aria-hidden='true' />
            {t('Limited-time event')}
          </Badge>
          <Badge variant={props.info.status === 'live' ? 'default' : 'outline'}>
            {statusLabel(props.info, t)}
          </Badge>
        </div>

        <div className='space-y-3'>
          <h1 className='text-3xl font-bold tracking-tight sm:text-5xl'>
            {t('Top-up Bonus')}
          </h1>
          <p className='text-muted-foreground max-w-2xl text-base sm:text-lg'>
            {t('Cumulative top-up rewards · up to {{amount}} in bonus credit', {
              amount: maxBonus,
            })}
          </p>
          {props.info.day_bonus_rate > 0 ? (
            <p className='text-sm font-medium text-rose-600 dark:text-rose-400'>
              {t('Bonus day · extra {{rate}} on every top-up', { rate })}
            </p>
          ) : null}
        </div>

        <div
          className={
            props.info.day_bonus_rate > 0
              ? 'grid gap-3 sm:grid-cols-3'
              : 'grid gap-3 sm:grid-cols-2'
          }
        >
          <div className='bg-background/60 rounded-xl border p-3 backdrop-blur'>
            <p className='text-muted-foreground text-xs'>{t('Max bonus')}</p>
            <p className='mt-1 text-lg font-semibold'>{maxBonus}</p>
          </div>
          {props.info.day_bonus_rate > 0 ? (
            <div className='bg-background/60 rounded-xl border p-3 backdrop-blur'>
              <p className='text-muted-foreground text-xs'>{t('Day bonus')}</p>
              <p className='mt-1 text-lg font-semibold'>+{rate}</p>
            </div>
          ) : null}
          <div className='bg-background/60 rounded-xl border p-3 backdrop-blur'>
            <p className='text-muted-foreground text-xs'>{t('Event period')}</p>
            <p className='mt-1 text-sm font-medium'>
              {start} – {end}
            </p>
          </div>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div className='space-y-2'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {countdownText}
            </p>
            <CampaignCountdown
              targetUnix={countdownTarget(props.info)}
              serverTime={props.info.server_time}
            />
          </div>
          <Button
            size='lg'
            className='sm:min-w-36'
            render={<Link to='/wallet' />}
          >
            {t('Top up now')}
          </Button>
        </div>
      </div>
    </section>
  )
}
