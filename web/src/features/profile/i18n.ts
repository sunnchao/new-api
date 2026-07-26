import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Purchase a plan to enjoy model benefits',
    },
  },
  zh: {
    translation: {
      'Purchase a plan to enjoy model benefits': '购买套餐后即可享受模型权益',
    },
  },
  fr: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Souscrivez un plan pour bénéficier des avantages des modèles',
    },
  },
  ja: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'プランを購入してモデルの特典を享受',
    },
  },
  ru: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Приобретите план, чтобы воспользоваться преимуществами моделей',
    },
  },
  vi: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Mua gói để tận hưởng quyền lợi mô hình',
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
