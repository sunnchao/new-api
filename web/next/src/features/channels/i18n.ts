import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Please fix the highlighted fields before saving':
        'Please fix the highlighted fields before saving',
    },
  },
  zh: {
    translation: {
      'Please fix the highlighted fields before saving':
        '请先修复高亮字段后再保存',
    },
  },
  fr: {
    translation: {
      'Please fix the highlighted fields before saving':
        'Veuillez corriger les champs en surbrillance avant d’enregistrer',
    },
  },
  ja: {
    translation: {
      'Please fix the highlighted fields before saving':
        '保存する前に強調表示された項目を修正してください',
    },
  },
  ru: {
    translation: {
      'Please fix the highlighted fields before saving':
        'Исправьте выделенные поля перед сохранением',
    },
  },
  vi: {
    translation: {
      'Please fix the highlighted fields before saving':
        'Vui lòng sửa các trường được đánh dấu trước khi lưu',
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
