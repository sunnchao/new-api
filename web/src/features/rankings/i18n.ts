import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      Hourly: 'Hourly',
    },
  },
  zh: {
    translation: {
      Hourly: '每小时',
    },
  },
  fr: {
    translation: {
      Hourly: 'Toutes les heures',
    },
  },
  ja: {
    translation: {
      Hourly: '毎時',
    },
  },
  ru: {
    translation: {
      Hourly: 'Ежечасно',
    },
  },
  vi: {
    translation: {
      Hourly: 'Hàng giờ',
    },
  },
} as const

for (const [language, resource] of Object.entries(resources)) {
  i18n.addResourceBundle(
    language,
    'translation',
    resource.translation,
    true,
    true
  )
}
