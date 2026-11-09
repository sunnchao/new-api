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

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toIntlLocale } from '@/i18n/languages'
import { formatCurrencyFromUSD } from '@/lib/currency'

import { useTopupCampaign } from '../hooks/use-topup-campaign'
import {
  countdownTarget,
  formatBonusRate,
  isCampaignVisible,
  maxTierBonus,
} from '../lib/campaign'
import { CampaignCountdown } from './campaign-countdown'

export function TopupCampaignBanner() {
  const { t, i18n } = useTranslation()
  const { data: info } = useTopupCampaign()

  if (!isCampaignVisible(info)) {
    return null
  }

  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const maxBonus = formatCurrencyFromUSD(maxTierBonus(info.tiers), {
    locale,
    digitsLarge: 0,
    digitsSmall: 2,
  })
  const rate = formatBonusRate(info.day_bonus_rate, locale)
  const subtitle =
    info.day_bonus_rate > 0
      ? t(
          'Up to {{amount}} in bonus credit · extra {{rate}} on the bonus day',
          {
            amount: maxBonus,
            rate,
          }
        )
      : t('Up to {{amount}} in bonus credit', { amount: maxBonus })

  return (
    <Card className='relative overflow-hidden border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-amber-400/5 to-transparent'>
      <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400'>
            <Sparkles className='size-4' aria-hidden='true' />
          </span>
          <div className='min-w-0'>
            <p className='text-sm font-semibold'>{t('Top-up Bonus')}</p>
            <p className='text-muted-foreground mt-0.5 text-xs'>{subtitle}</p>
          </div>
        </div>
        <div className='flex items-center justify-between gap-3 sm:justify-end'>
          <CampaignCountdown
            variant='compact'
            targetUnix={countdownTarget(info)}
            serverTime={info.server_time}
          />
          <Button size='sm' render={<Link to='/activities/double11' />}>
            {t('View event')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
