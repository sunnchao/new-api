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

import { toIntlLocale } from '@/i18n/languages'

import { formatBonusRate, formatCampaignDate } from '../lib/campaign'
import type { TopupCampaignInfo } from '../types'

export function CampaignRules(props: { info: TopupCampaignInfo }) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const dayStart = formatCampaignDate(props.info.day_bonus_start, locale)
  const dayEnd = formatCampaignDate(props.info.day_bonus_end, locale)
  const rate = formatBonusRate(props.info.day_bonus_rate, locale)

  const rules = [
    t(
      'Cumulative top-ups are counted by credited amount; refunded orders are excluded.'
    ),
    t(
      'Redemption-code top-ups count toward your cumulative top-up and bonuses too.'
    ),
    t(
      'Tier bonuses are granted automatically when you reach a tier and are paid as gift quota.'
    ),
    props.info.day_bonus_rate > 0
      ? t(
          'Every top-up from {{start}} to {{end}} (UTC+8) earns an extra {{rate}}, stacking with tier bonuses.',
          { start: dayStart, end: dayEnd, rate }
        )
      : null,
    t(
      'Gift quota is spent before your regular balance and may expire; see the gift quota history on your profile page.'
    ),
    t(
      'Top-ups completed before the event starts or after it ends do not count.'
    ),
    t(
      'Accounts found abusing the event lose eligibility; the platform may adjust or end the event early.'
    ),
  ].filter((rule): rule is string => rule !== null)

  return (
    <section className='rounded-2xl border p-5 sm:p-6'>
      <h2 className='text-lg font-semibold'>{t('Event rules')}</h2>
      <ul className='text-muted-foreground mt-3 list-disc space-y-2 pl-5 text-sm'>
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  )
}
