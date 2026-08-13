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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { createInstance } from 'i18next'

import { systemSettingsI18nResources } from '../../i18n'

const translations = [
  {
    language: 'en',
    title: 'Gift Quota Expiration',
    permanent: 'Permanent',
    duration: 'Fixed duration',
    days: 'Days',
    months: 'Months',
  },
  {
    language: 'zhCN',
    title: '赠送额度有效期',
    permanent: '永久',
    duration: '固定时长',
    days: '天',
    months: '个月',
  },
  {
    language: 'zhTW',
    title: '贈送額度有效期',
    permanent: '永久',
    duration: '固定時長',
    days: '天',
    months: '個月',
  },
  {
    language: 'fr',
    title: 'Expiration du quota offert',
    permanent: 'Permanent',
    duration: 'Durée fixe',
    days: 'Jours',
    months: 'Mois',
  },
  {
    language: 'ja',
    title: '付与クォータの有効期限',
    permanent: '無期限',
    duration: '期間を設定',
    days: '日',
    months: 'か月',
  },
  {
    language: 'ru',
    title: 'Срок действия подарочной квоты',
    permanent: 'Бессрочно',
    duration: 'Ограниченный срок',
    days: 'Дни',
    months: 'Месяцы',
  },
  {
    language: 'vi',
    title: 'Thời hạn hạn mức được tặng',
    permanent: 'Vĩnh viễn',
    duration: 'Thời hạn cố định',
    days: 'Ngày',
    months: 'Tháng',
  },
] as const

describe('gift quota expiration translations', () => {
  for (const expected of translations) {
    test(`renders the configuration labels in ${expected.language}`, async () => {
      const i18n = createInstance()
      await i18n.init({
        resources: systemSettingsI18nResources,
        lng: expected.language,
        fallbackLng: 'en',
      })

      assert.equal(i18n.t('Gift Quota Expiration'), expected.title)
      assert.equal(i18n.t('Permanent'), expected.permanent)
      assert.equal(i18n.t('Fixed duration'), expected.duration)
      assert.equal(i18n.t('Days'), expected.days)
      assert.equal(i18n.t('Months'), expected.months)
    })
  }
})
