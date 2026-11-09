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
import { Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { toIntlLocale } from '@/i18n/languages'
import { formatCurrencyFromUSD } from '@/lib/currency'

import { tierProgressPercent } from '../lib/campaign'
import type { TopupCampaignInfo } from '../types'

export function MyProgressCard(props: { info: TopupCampaignInfo }) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const self = props.info.self
  const money = (value: number) =>
    formatCurrencyFromUSD(value, {
      locale,
      digitsLarge: 0,
      digitsSmall: 2,
    })

  if (!self) {
    return (
      <section className='flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <p className='text-muted-foreground text-sm'>
          {t('Sign in to view your progress')}
        </p>
        <Button variant='outline' render={<Link to='/sign-in' />}>
          {t('Sign in')}
        </Button>
      </section>
    )
  }

  if (props.info.status === 'upcoming') {
    return (
      <section className='rounded-2xl border p-5 sm:p-6'>
        <div className='flex items-center gap-2'>
          <Gift className='size-4 text-rose-500' aria-hidden='true' />
          <h2 className='text-lg font-semibold'>{t('My progress')}</h2>
        </div>
        <p className='text-muted-foreground mt-3 text-sm'>
          {t(
            'The event has not started yet; top-ups completed after it begins will count toward your progress.'
          )}
        </p>
      </section>
    )
  }

  const percent = tierProgressPercent(props.info)
  const totalBonus = self.tier_bonus_granted + self.day_bonus_granted
  const currentTier =
    self.current_tier_index >= 0
      ? props.info.tiers[self.current_tier_index]
      : undefined
  const nextTierText = self.top_reached
    ? t('You have reached the top tier')
    : t('{{gap}} more to reach the {{amount}} tier', {
        gap: money(self.gap_to_next ?? 0),
        amount: money(self.next_tier_amount ?? 0),
      })

  return (
    <section className='rounded-2xl border p-5 sm:p-6'>
      <div className='flex items-center gap-2'>
        <Gift className='size-4 text-rose-500' aria-hidden='true' />
        <h2 className='text-lg font-semibold'>{t('My progress')}</h2>
      </div>

      <div className='mt-4 grid gap-4 sm:grid-cols-3'>
        <div>
          <p className='text-muted-foreground text-xs'>
            {t('Cumulative top-up')}
          </p>
          <p className='mt-1 text-xl font-semibold'>
            {money(self.cumulative_amount)}
          </p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>{t('Bonus received')}</p>
          <p className='mt-1 text-xl font-semibold text-rose-600 dark:text-rose-400'>
            {money(totalBonus)}
          </p>
          {totalBonus > 0 ? (
            <p className='text-muted-foreground mt-1 text-xs'>
              {props.info.day_bonus_rate > 0
                ? t('Of which tier bonus {{tier}} · day bonus {{day}}', {
                    tier: money(self.tier_bonus_granted),
                    day: money(self.day_bonus_granted),
                  })
                : t('Of which tier bonus {{tier}}', {
                    tier: money(self.tier_bonus_granted),
                  })}
            </p>
          ) : null}
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>{t('Current tier')}</p>
          <p className='mt-1 text-xl font-semibold'>
            {currentTier ? money(currentTier.min_amount) : t('No tier yet')}
          </p>
        </div>
      </div>

      <div className='mt-5 space-y-2'>
        <div
          className='bg-muted h-2.5 w-full overflow-hidden rounded-full'
          role='progressbar'
          aria-label={t('Progress to next tier')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className='h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-[width] duration-500'
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className='text-muted-foreground text-sm'>{nextTierText}</p>
      </div>
    </section>
  )
}
