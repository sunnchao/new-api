import i18n from '@/i18n/config'

export const apiKeysI18nResources = {
  en: {
    translation: {
      '{{count}} model(s)': '{{count}} model(s)',
      'Add backup group': 'Add backup group',
      'Backup Group {{count}}': 'Backup Group {{count}}',
      'Backup Groups': 'Backup Groups',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Fallback groups are tried in order when the primary group has no available channel.',
      'Remove backup group': 'Remove backup group',
      'Primary Group': 'Primary Group',
      'Select a backup group': 'Select a backup group',
    },
  },
  zhCN: {
    translation: {
      '{{count}} model(s)': '{{count}} 个模型',
      'Add backup group': '添加备用分组',
      'Backup Group {{count}}': '备用分组 {{count}}',
      'Backup Groups': '备用分组',
      'Fallback groups are tried in order when the primary group has no available channel.':
        '主分组没有可用渠道时，将按顺序尝试备用分组。',
      'Remove backup group': '移除备用分组',
      'Primary Group': '主分组',
      'Select a backup group': '请选择备用分组',
    },
  },
  zhTW: {
    translation: {
      'Backup Group {{count}}': '備用分組 {{count}}',
      'Primary Group': '主分組',
    },
  },
  fr: {
    translation: {
      '{{count}} model(s)': '{{count}} modèle(s)',
      'Add backup group': 'Ajouter un groupe de secours',
      'Backup Group {{count}}': 'Groupe de secours {{count}}',
      'Backup Groups': 'Groupes de secours',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Les groupes de secours sont essayés dans l’ordre lorsque le groupe principal n’a aucun canal disponible.',
      'Remove backup group': 'Supprimer le groupe de secours',
      'Primary Group': 'Groupe principal',
      'Select a backup group': 'Sélectionner un groupe de secours',
    },
  },
  ja: {
    translation: {
      '{{count}} model(s)': '{{count}} モデル',
      'Add backup group': 'バックアップグループを追加',
      'Backup Group {{count}}': '予備グループ {{count}}',
      'Backup Groups': 'バックアップグループ',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'プライマリグループに利用可能なチャネルがない場合、バックアップグループを順番に試します。',
      'Remove backup group': 'バックアップグループを削除',
      'Primary Group': 'メイングループ',
      'Select a backup group': 'バックアップグループを選択',
    },
  },
  ru: {
    translation: {
      '{{count}} model(s)': '{{count}} модел(ей)',
      'Add backup group': 'Добавить резервную группу',
      'Backup Group {{count}}': 'Резервная группа {{count}}',
      'Backup Groups': 'Резервные группы',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Резервные группы пробуются по порядку, когда в основной группе нет доступного канала.',
      'Remove backup group': 'Удалить резервную группу',
      'Primary Group': 'Основная группа',
      'Select a backup group': 'Выберите резервную группу',
    },
  },
  vi: {
    translation: {
      '{{count}} model(s)': '{{count}} mô hình',
      'Add backup group': 'Thêm nhóm dự phòng',
      'Backup Group {{count}}': 'Nhóm dự phòng {{count}}',
      'Backup Groups': 'Nhóm dự phòng',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Các nhóm dự phòng sẽ được thử theo thứ tự khi nhóm chính không có kênh khả dụng.',
      'Remove backup group': 'Xóa nhóm dự phòng',
      'Primary Group': 'Nhóm chính',
      'Select a backup group': 'Chọn nhóm dự phòng',
    },
  },
} as const

for (const [language, resource] of Object.entries(apiKeysI18nResources)) {
  i18n.addResourceBundle(
    language,
    'translation',
    resource.translation,
    true,
    true
  )
}
