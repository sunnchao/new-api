import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Allow subscription purchases for invoices':
        'Allow subscription purchases for invoices',
      'Protect login and registration with Cloudflare Turnstile':
        'Protect login and registration with Cloudflare Turnstile',
      'Public page with support contact information.':
        'Public page with support contact information.',
      'Public subscription plan catalog.': 'Public subscription plan catalog.',
      'Purchase a plan to enjoy model benefits':
        'Purchase a plan to enjoy model benefits',
      'Require login to view subscription plans':
        'Require login to view subscription plans',
      'Visitors must authenticate before accessing subscription plans.':
        'Visitors must authenticate before accessing subscription plans.',
      'When enabled, paid subscription orders can be selected in invoice requests.':
        'When enabled, paid subscription orders can be selected in invoice requests.',
      'Client restrictions': 'Client restrictions',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.',
    },
  },
  zh: {
    translation: {
      'Allow subscription purchases for invoices': '允许订阅购买记录开票',
      'Protect login and registration with Cloudflare Turnstile':
        '使用 Cloudflare Turnstile 保护登录和注册',
      'Public page with support contact information.':
        '展示支持联系方式的公开页面。',
      'Public subscription plan catalog.': '公开订阅套餐目录。',
      'Purchase a plan to enjoy model benefits': '购买套餐后即可享受模型权益',
      'Require login to view subscription plans': '要求登录才能查看订阅套餐',
      'Visitors must authenticate before accessing subscription plans.':
        '访客必须登录后才能访问订阅套餐。',
      'When enabled, paid subscription orders can be selected in invoice requests.':
        '开启后，已支付的订阅订单可在开票申请中选择。',
      'Client restrictions': '客户端限制',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        '分组到允许客户端的 JSON 映射。允许的客户端 ID 为 claude_code 和 codex；未配置或空列表的分组不限制。',
    },
  },
  fr: {
    translation: {
      'Allow subscription purchases for invoices':
        "Autoriser les achats d'abonnement pour les factures",
      'Protect login and registration with Cloudflare Turnstile':
        "Protéger la connexion et l'inscription avec Cloudflare Turnstile",
      'Public page with support contact information.':
        'Page publique avec les informations de contact du support.',
      'Public subscription plan catalog.': 'Catalogue public des abonnements.',
      'Purchase a plan to enjoy model benefits':
        'Souscrivez un plan pour bénéficier des avantages des modèles',
      'Require login to view subscription plans':
        'Exiger la connexion pour voir les abonnements',
      'Visitors must authenticate before accessing subscription plans.':
        'Les visiteurs doivent se connecter avant d’accéder aux abonnements.',
      'When enabled, paid subscription orders can be selected in invoice requests.':
        "Une fois activé, les commandes d'abonnement payées peuvent être sélectionnées dans les demandes de facture.",
      'Client restrictions': 'Restrictions de client',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'Objet JSON associant chaque groupe aux clients autorisés. Les IDs autorisés sont claude_code et codex ; les groupes absents ou vides ne sont pas restreints.',
    },
  },
  ja: {
    translation: {
      'Allow subscription purchases for invoices':
        'サブスクリプション購入の請求書発行を許可',
      'Protect login and registration with Cloudflare Turnstile':
        'Cloudflare Turnstileでログインと登録を保護する',
      'Public page with support contact information.':
        'サポート連絡先を表示する公開ページ。',
      'Public subscription plan catalog.':
        '公開サブスクリプションプランカタログ。',
      'Purchase a plan to enjoy model benefits':
        'プランを購入してモデルの特典を享受',
      'Require login to view subscription plans':
        'サブスクリプションプランの表示にログインを要求する',
      'Visitors must authenticate before accessing subscription plans.':
        '訪問者はサブスクリプションプランにアクセスする前に認証する必要があります。',
      'When enabled, paid subscription orders can be selected in invoice requests.':
        '有効にすると、支払い済みのサブスクリプション注文を請求書申請で選択できます。',
      'Client restrictions': 'クライアント制限',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'グループから許可クライアントへの JSON マップです。許可されるクライアント ID は claude_code と codex です。未設定または空のグループは制限されません。',
    },
  },
  ru: {
    translation: {
      'Allow subscription purchases for invoices':
        'Разрешить выставлять счета за покупки подписок',
      'Protect login and registration with Cloudflare Turnstile':
        'Защитите вход и регистрацию с помощью Cloudflare Turnstile',
      'Public page with support contact information.':
        'Публичная страница с контактами поддержки.',
      'Public subscription plan catalog.': 'Публичный каталог подписок.',
      'Purchase a plan to enjoy model benefits':
        'Приобретите план, чтобы воспользоваться преимуществами моделей',
      'Require login to view subscription plans':
        'Требовать вход для просмотра подписок',
      'Visitors must authenticate before accessing subscription plans.':
        'Посетители должны войти в систему перед доступом к подпискам.',
      'When enabled, paid subscription orders can be selected in invoice requests.':
        'Если включено, оплаченные заказы подписки можно выбирать в заявках на счет.',
      'Client restrictions': 'Ограничения клиентов',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'JSON-объект, сопоставляющий группы с разрешенными клиентами. Допустимые ID клиентов: claude_code и codex; отсутствующие группы или пустые списки не ограничиваются.',
    },
  },
  vi: {
    translation: {
      'Allow subscription purchases for invoices':
        'Cho phép mua gói đăng ký để xuất hóa đơn',
      'Protect login and registration with Cloudflare Turnstile':
        'Bảo vệ đăng nhập và đăng ký bằng Cloudflare Turnstile',
      'Public page with support contact information.':
        'Trang công khai hiển thị thông tin liên hệ hỗ trợ.',
      'Public subscription plan catalog.': 'Danh mục gói đăng ký công khai.',
      'Purchase a plan to enjoy model benefits':
        'Mua gói để tận hưởng quyền lợi mô hình',
      'Require login to view subscription plans':
        'Yêu cầu đăng nhập để xem gói đăng ký',
      'Visitors must authenticate before accessing subscription plans.':
        'Khách truy cập phải xác thực trước khi xem các gói đăng ký.',
      'When enabled, paid subscription orders can be selected in invoice requests.':
        'Khi bật, các đơn đăng ký đã thanh toán có thể được chọn trong yêu cầu hóa đơn.',
      'Client restrictions': 'Giới hạn client',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'Bản đồ JSON từ nhóm sang các client được phép. ID client hợp lệ là claude_code và codex; nhóm bị thiếu hoặc có danh sách rỗng sẽ không bị giới hạn.',
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
