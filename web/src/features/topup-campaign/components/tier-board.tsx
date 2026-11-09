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

import { Badge } from '@/components/ui/badge'
import { toIntlLocale } from '@/i18n/languages'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { cn } from '@/lib/utils'

import type { TopupCampaignInfo } from '../types'

export function TierBoard(props: { info: TopupCampaignInfo }) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const currentIndex = props.info.self?.current_tier_index ?? -1
  const money = (value: number) =>
    formatCurrencyFromUSD(value, {
      locale,
      digitsLarge: 0,
      digitsSmall: 2,
    })

  return (
    <section className='rounded-2xl border p-5 sm:p-6'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>
          {t('Cumulative top-up bonus')}
        </h2>
        <p className='text-muted-foreground text-sm'>
          {t(
            'Reach a cumulative top-up amount during the event to unlock that tier’s API credit bonus.'
          )}
        </p>
      </div>

      <div className='mt-4 overflow-x-auto'>
        <table className='w-full min-w-[360px] text-sm'>
          <thead>
            <tr className='text-muted-foreground border-b text-left'>
              <th className='py-2 pr-3 font-medium'>
                {t('Cumulative top-up')}
              </th>
              <th className='py-2 font-medium'>{t('Tier bonus')}</th>
            </tr>
          </thead>
          <tbody>
            {props.info.tiers.map((tier, index) => {
              const isCurrent = index === currentIndex
              return (
                <tr
                  key={tier.min_amount}
                  className={cn(
                    'border-b last:border-0',
                    isCurrent && 'bg-primary/5'
                  )}
                >
                  <td className='py-3 pr-3'>
                    <div className='flex flex-wrap items-center gap-2 font-medium'>
                      {money(tier.min_amount)}
                      {isCurrent ? (
                        <Badge variant='secondary'>{t('Current tier')}</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className='py-3 font-semibold text-rose-600 dark:text-rose-400'>
                    {money(tier.bonus_amount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
