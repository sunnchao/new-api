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
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { chatI18nResources } from '../features/chat/i18n'
import { homeI18nResources } from '../features/home/i18n'
import { pricingI18nResources } from '../features/pricing/i18n'
import { subscriptionsI18nResources } from '../features/subscriptions/i18n'
import { ticketsI18nResources } from '../features/tickets/i18n'
import { usageLogsI18nResources } from '../features/usage-logs/i18n'

import en from './locales/en.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'
import ru from './locales/ru.json'
import vi from './locales/vi.json'
import zhCN from './locales/zh.json'
import zhTW from './locales/zh-TW.json'

function mergeFeatureTranslations(
  base: { translation: Record<string, string> },
  ...extras: { translation: Record<string, string> }[]
) {
  return extras.reduce(
    (merged, extra) => ({
      ...merged,
      translation: {
        ...merged.translation,
        ...extra.translation,
      },
    }),
    base
  )
}

export const resources = {
  en: mergeFeatureTranslations(
    en,
    pricingI18nResources.en,
    subscriptionsI18nResources.en,
    usageLogsI18nResources.en,
    chatI18nResources.en,
    ticketsI18nResources.en,
    homeI18nResources.en
  ),
zhCN: mergeFeatureTranslations(
    zhCN,
    pricingI18nResources.zhCN,
    subscriptionsI18nResources.zhCN,
    usageLogsI18nResources.zhCN,
    chatI18nResources.zhCN,
    ticketsI18nResources.zhCN,
    homeI18nResources.zhCN
  ),
  fr: mergeFeatureTranslations(
    fr,
    pricingI18nResources.fr,
    subscriptionsI18nResources.fr,
    usageLogsI18nResources.fr,
    chatI18nResources.fr,
    ticketsI18nResources.fr,
    homeI18nResources.fr
  ),
  ru: mergeFeatureTranslations(
    ru,
    pricingI18nResources.ru,
    subscriptionsI18nResources.ru,
    usageLogsI18nResources.ru,
    chatI18nResources.ru,
    ticketsI18nResources.ru,
    homeI18nResources.ru
  ),
  ja: mergeFeatureTranslations(
    ja,
    pricingI18nResources.ja,
    subscriptionsI18nResources.ja,
    usageLogsI18nResources.ja,
    chatI18nResources.ja,
    ticketsI18nResources.ja,
    homeI18nResources.ja
  ),
  vi: mergeFeatureTranslations(
    vi,
    pricingI18nResources.vi,
    subscriptionsI18nResources.vi,
    usageLogsI18nResources.vi,
    chatI18nResources.vi,
    ticketsI18nResources.vi,
    homeI18nResources.vi
  ),
  zhTW: mergeFeatureTranslations(
    zhTW,
    pricingI18nResources.zhTW,
    subscriptionsI18nResources.zhTW,
    usageLogsI18nResources.zhTW,
    chatI18nResources.zhTW,
    ticketsI18nResources.zhTW,
    homeI18nResources.zhTW
  ),
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zhCN', 'fr', 'ru', 'ja', 'vi','zhTW'],
    load: 'currentOnly', // Convert zh-CN -> zh
    nsSeparator: false, // Allow literal colons in keys (e.g., URLs, labels)
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
