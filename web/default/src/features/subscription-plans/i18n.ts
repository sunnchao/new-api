import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      '{{count}} plan(s) available': '{{count}} plan(s) available',
      'Browse available subscription plans':
        'Browse available subscription plans',
      'Browse available subscription plans and choose the access package that fits your usage.':
        'Browse available subscription plans and choose the access package that fits your usage.',
      'No subscription plans available': 'No subscription plans available',
      'Please refresh the page and try again.':
        'Please refresh the page and try again.',
      'Subscription Catalog': 'Subscription Catalog',
      'There are no enabled subscription plans yet.':
        'There are no enabled subscription plans yet.',
      'Unable to load subscription plans': 'Unable to load subscription plans',
    },
  },
  zh: {
    translation: {
      '{{count}} plan(s) available': '共 {{count}} 个套餐可用',
      'Browse available subscription plans': '浏览可用订阅套餐',
      'Browse available subscription plans and choose the access package that fits your usage.':
        '浏览可用订阅套餐，选择适合你使用量的访问方案。',
      'No subscription plans available': '暂无可用订阅套餐',
      'Please refresh the page and try again.': '请刷新页面后重试。',
      'Subscription Catalog': '订阅目录',
      'There are no enabled subscription plans yet.':
        '目前还没有已启用的订阅套餐。',
      'Unable to load subscription plans': '无法加载订阅套餐',
    },
  },
  fr: {
    translation: {
      '{{count}} plan(s) available': '{{count}} abonnement(s) disponible(s)',
      'Browse available subscription plans':
        'Parcourir les abonnements disponibles',
      'Browse available subscription plans and choose the access package that fits your usage.':
        'Parcourez les abonnements disponibles et choisissez l’offre adaptée à votre usage.',
      'No subscription plans available': 'Aucun abonnement disponible',
      'Please refresh the page and try again.':
        'Veuillez actualiser la page puis réessayer.',
      'Subscription Catalog': 'Catalogue des abonnements',
      'There are no enabled subscription plans yet.':
        'Aucun abonnement activé n’est disponible pour le moment.',
      'Unable to load subscription plans':
        'Impossible de charger les abonnements',
    },
  },
  ja: {
    translation: {
      '{{count}} plan(s) available': '{{count}} 件のプランが利用可能',
      'Browse available subscription plans':
        '利用可能なサブスクリプションプランを表示',
      'Browse available subscription plans and choose the access package that fits your usage.':
        '利用可能なサブスクリプションプランを確認し、利用量に合うアクセスパッケージを選択できます。',
      'No subscription plans available':
        '利用可能なサブスクリプションプランはありません',
      'Please refresh the page and try again.':
        'ページを更新してもう一度お試しください。',
      'Subscription Catalog': 'サブスクリプションカタログ',
      'There are no enabled subscription plans yet.':
        '有効なサブスクリプションプランはまだありません。',
      'Unable to load subscription plans':
        'サブスクリプションプランを読み込めません',
    },
  },
  ru: {
    translation: {
      '{{count}} plan(s) available': 'Доступно планов: {{count}}',
      'Browse available subscription plans': 'Просмотреть доступные подписки',
      'Browse available subscription plans and choose the access package that fits your usage.':
        'Просмотрите доступные подписки и выберите пакет доступа под свой сценарий использования.',
      'No subscription plans available': 'Нет доступных подписок',
      'Please refresh the page and try again.':
        'Обновите страницу и повторите попытку.',
      'Subscription Catalog': 'Каталог подписок',
      'There are no enabled subscription plans yet.':
        'Пока нет включенных подписок.',
      'Unable to load subscription plans': 'Не удалось загрузить подписки',
    },
  },
  vi: {
    translation: {
      '{{count}} plan(s) available': 'Có {{count}} gói khả dụng',
      'Browse available subscription plans': 'Xem các gói đăng ký hiện có',
      'Browse available subscription plans and choose the access package that fits your usage.':
        'Xem các gói đăng ký hiện có và chọn gói truy cập phù hợp với nhu cầu sử dụng của bạn.',
      'No subscription plans available': 'Không có gói đăng ký khả dụng',
      'Please refresh the page and try again.':
        'Vui lòng làm mới trang rồi thử lại.',
      'Subscription Catalog': 'Danh mục đăng ký',
      'There are no enabled subscription plans yet.':
        'Hiện chưa có gói đăng ký nào được bật.',
      'Unable to load subscription plans': 'Không thể tải các gói đăng ký',
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
