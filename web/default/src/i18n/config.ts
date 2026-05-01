import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { pricingI18nResources } from '../features/pricing/i18n'
import { usageLogsI18nResources } from '../features/usage-logs/i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'
import ru from './locales/ru.json'
import vi from './locales/vi.json'
import zh from './locales/zh.json'

function mergeFeatureTranslations<
  T extends { translation: Record<string, string> },
>(base: T, extra: { translation: Record<string, string> }) {
  return {
    ...base,
    translation: {
      ...base.translation,
      ...extra.translation,
    },
  }
}

export const resources = {
  en: mergeFeatureTranslations(mergeFeatureTranslations(en, pricingI18nResources.en), usageLogsI18nResources.en),
  zh: mergeFeatureTranslations(mergeFeatureTranslations(zh, pricingI18nResources.zh), usageLogsI18nResources.zh),
  fr: mergeFeatureTranslations(mergeFeatureTranslations(fr, pricingI18nResources.fr), usageLogsI18nResources.fr),
  ru: mergeFeatureTranslations(mergeFeatureTranslations(ru, pricingI18nResources.ru), usageLogsI18nResources.ru),
  ja: mergeFeatureTranslations(mergeFeatureTranslations(ja, pricingI18nResources.ja), usageLogsI18nResources.ja),
  vi: mergeFeatureTranslations(mergeFeatureTranslations(vi, pricingI18nResources.vi), usageLogsI18nResources.vi),
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', 'fr', 'ru', 'ja', 'vi'],
    load: 'languageOnly', // Convert zh-CN -> zh
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
