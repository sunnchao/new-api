import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Add backup group': 'Add backup group',
      'API key is loading, please try again in a moment':
        'API key is loading, please try again in a moment',
      'Backup Groups': 'Backup Groups',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Fallback groups are tried in order when the primary group has no available channel.',
      'Filter by API key': 'Filter by API key',
      'Filter by name...': 'Filter by name...',
      'Remove backup group': 'Remove backup group',
      'Select a backup group': 'Select a backup group',
    },
  },
  zh: {
    translation: {
      'Add backup group': '添加备用分组',
      'API key is loading, please try again in a moment':
        'API 密钥正在加载，请稍后再试',
      'Backup Groups': '备用分组',
      'Fallback groups are tried in order when the primary group has no available channel.':
        '主分组没有可用渠道时，将按顺序尝试备用分组。',
      'Filter by API key': '按 API 密钥筛选',
      'Filter by name...': '按名称筛选...',
      'Remove backup group': '移除备用分组',
      'Select a backup group': '请选择备用分组',
    },
  },
  fr: {
    translation: {
      'Add backup group': 'Ajouter un groupe de secours',
      'API key is loading, please try again in a moment':
        'La clé API est en cours de chargement, veuillez réessayer dans un instant',
      'Backup Groups': 'Groupes de secours',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Les groupes de secours sont essayés dans l’ordre lorsque le groupe principal n’a aucun canal disponible.',
      'Filter by API key': 'Filtrer par clé API',
      'Filter by name...': 'Filtrer par nom...',
      'Remove backup group': 'Supprimer le groupe de secours',
      'Select a backup group': 'Sélectionner un groupe de secours',
    },
  },
  ja: {
    translation: {
      'Add backup group': 'バックアップグループを追加',
      'API key is loading, please try again in a moment':
        'APIキーを読み込んでいます。しばらくしてからもう一度お試しください',
      'Backup Groups': 'バックアップグループ',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'プライマリグループに利用可能なチャネルがない場合、バックアップグループを順番に試します。',
      'Filter by API key': 'APIキーで絞り込み',
      'Filter by name...': '名前で絞り込み...',
      'Remove backup group': 'バックアップグループを削除',
      'Select a backup group': 'バックアップグループを選択',
    },
  },
  ru: {
    translation: {
      'Add backup group': 'Добавить резервную группу',
      'API key is loading, please try again in a moment':
        'Ключ API загружается, повторите попытку через мгновение',
      'Backup Groups': 'Резервные группы',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Резервные группы пробуются по порядку, когда в основной группе нет доступного канала.',
      'Filter by API key': 'Фильтр по API-ключу',
      'Filter by name...': 'Фильтр по названию...',
      'Remove backup group': 'Удалить резервную группу',
      'Select a backup group': 'Выберите резервную группу',
    },
  },
  vi: {
    translation: {
      'Add backup group': 'Thêm nhóm dự phòng',
      'API key is loading, please try again in a moment':
        'Khóa API đang tải, vui lòng thử lại sau giây lát',
      'Backup Groups': 'Nhóm dự phòng',
      'Fallback groups are tried in order when the primary group has no available channel.':
        'Các nhóm dự phòng sẽ được thử theo thứ tự khi nhóm chính không có kênh khả dụng.',
      'Filter by API key': 'Lọc theo khóa API',
      'Filter by name...': 'Lọc theo tên...',
      'Remove backup group': 'Xóa nhóm dự phòng',
      'Select a backup group': 'Chọn nhóm dự phòng',
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
