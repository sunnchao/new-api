import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Choose default drawing mode for Midjourney requests.':
        'Choose default drawing mode for Midjourney requests.',
      'Drawing Mode': 'Drawing Mode',
      Fast: 'Fast',
      'Filter by API key': 'Filter by API key',
      'Owner User ID': 'Owner User ID',
      'Owner cannot be changed after creation.':
        'Owner cannot be changed after creation.',
      'Please enter a valid user ID': 'Please enter a valid user ID',
      Relax: 'Relax',
      'Set owner and basic information': 'Set owner and basic information',
      Turbo: 'Turbo',
    },
  },
  zh: {
    translation: {
      'Choose default drawing mode for Midjourney requests.':
        '为 Midjourney 请求选择默认绘图模式。',
      'Drawing Mode': '绘图模式',
      Fast: '快速',
      'Filter by API key': '按 API 密钥筛选',
      'Owner User ID': '归属用户 ID',
      'Owner cannot be changed after creation.': '创建后不能修改归属用户。',
      'Please enter a valid user ID': '请输入有效的用户 ID',
      Relax: '放松',
      'Set owner and basic information': '设置归属用户和基础信息',
      Turbo: '极速',
    },
  },
  fr: {
    translation: {
      'Choose default drawing mode for Midjourney requests.':
        'Choisissez le mode de dessin par défaut pour les requêtes Midjourney.',
      'Drawing Mode': 'Mode de dessin',
      Fast: 'Rapide',
      'Filter by API key': 'Filtrer par clé API',
      'Owner User ID': 'ID utilisateur propriétaire',
      'Owner cannot be changed after creation.':
        'Le propriétaire ne peut pas être modifié après la création.',
      'Please enter a valid user ID':
        'Veuillez saisir un ID utilisateur valide',
      Relax: 'Relax',
      'Set owner and basic information':
        'Définir le propriétaire et les informations de base',
      Turbo: 'Turbo',
    },
  },
  ja: {
    translation: {
      'Choose default drawing mode for Midjourney requests.':
        'Midjourney リクエストの既定の描画モードを選択します。',
      'Drawing Mode': '描画モード',
      Fast: '高速',
      'Filter by API key': 'API キーで絞り込み',
      'Owner User ID': '所有者ユーザー ID',
      'Owner cannot be changed after creation.':
        '作成後に所有者を変更することはできません。',
      'Please enter a valid user ID': '有効なユーザー ID を入力してください',
      Relax: 'リラックス',
      'Set owner and basic information': '所有者と基本情報を設定します',
      Turbo: 'ターボ',
    },
  },
  ru: {
    translation: {
      'Choose default drawing mode for Midjourney requests.':
        'Выберите режим рисования по умолчанию для запросов Midjourney.',
      'Drawing Mode': 'Режим рисования',
      Fast: 'Быстрый',
      'Filter by API key': 'Фильтр по ключу API',
      'Owner User ID': 'ID пользователя-владельца',
      'Owner cannot be changed after creation.':
        'Владельца нельзя изменить после создания.',
      'Please enter a valid user ID': 'Введите корректный ID пользователя',
      Relax: 'Relax',
      'Set owner and basic information':
        'Укажите владельца и основную информацию',
      Turbo: 'Turbo',
    },
  },
  vi: {
    translation: {
      'Choose default drawing mode for Midjourney requests.':
        'Chọn chế độ vẽ mặc định cho yêu cầu Midjourney.',
      'Drawing Mode': 'Chế độ vẽ',
      Fast: 'Nhanh',
      'Filter by API key': 'Lọc theo khóa API',
      'Owner User ID': 'ID người dùng sở hữu',
      'Owner cannot be changed after creation.':
        'Không thể đổi người sở hữu sau khi tạo.',
      'Please enter a valid user ID': 'Vui lòng nhập ID người dùng hợp lệ',
      Relax: 'Relax',
      'Set owner and basic information':
        'Thiết lập người sở hữu và thông tin cơ bản',
      Turbo: 'Turbo',
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
