import i18n from '@/i18n/config'

export const usageLogsI18nResources = {
  en: {
    translation: {
      Sign: 'Sign-in',
      request_ip: 'Request IP',
      'Adjust filters, then search to refresh the logs.':
        'Adjust filters, then search to refresh the logs.',
      Time: 'Time',
      Timing: 'Timing',
      Details: 'Details',
    },
  },
  zh: {
    translation: {
      Sign: '签到',
      request_ip: '请求IP',
      'Adjust filters, then search to refresh the logs.':
        '调整筛选条件，然后搜索以刷新日志。',
      Time: '时间',
      Timing: '耗时',
      Details: '详情',
    },
  },
  fr: {
    translation: {
      Sign: 'Check-in',
      request_ip: 'IP de requête',
      'Adjust filters, then search to refresh the logs.':
        'Ajustez les filtres, puis lancez la recherche pour actualiser les journaux.',
      Time: 'Heure',
      Timing: 'Durée',
      Details: 'Détails',
    },
  },
  ja: {
    translation: {
      Sign: 'サインイン',
      request_ip: 'リクエストIP',
      'Adjust filters, then search to refresh the logs.':
        'フィルターを調整してから検索し、ログを更新します。',
      Time: '時間',
      Timing: '所要時間',
      Details: '詳細',
    },
  },
  ru: {
    translation: {
      Sign: 'Регистрация',
      request_ip: 'IP запроса',
      'Adjust filters, then search to refresh the logs.':
        'Настройте фильтры, затем выполните поиск, чтобы обновить журналы.',
      Time: 'Время',
      Timing: 'Время',
      Details: 'Детали',
    },
  },
  vi: {
    translation: {
      Sign: 'Điểm danh',
      request_ip: 'IP yêu cầu',
      'Adjust filters, then search to refresh the logs.':
        'Điều chỉnh bộ lọc, sau đó tìm kiếm để làm mới nhật ký.',
      Time: 'Thời gian',
      Timing: 'Thời gian',
      Details: 'Chi tiết',
    },
  },
} as const

for (const [language, resource] of Object.entries(usageLogsI18nResources)) {
  i18n.addResourceBundle(language, 'translation', resource.translation, true, true)
}
