import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      '{{count}} model(s)': '{{count}} model(s)',
    },
  },
  zh: {
    translation: {
      '{{count}} model(s)': '{{count}} 个模型',
    },
  },
  fr: {
    translation: {
      '{{count}} model(s)': '{{count}} modèle(s)',
    },
  },
  ja: {
    translation: {
      '{{count}} model(s)': '{{count}} モデル',
    },
  },
  ru: {
    translation: {
      '{{count}} model(s)': '{{count}} модел(ей)',
    },
  },
  vi: {
    translation: {
      '{{count}} model(s)': '{{count}} mô hình',
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
