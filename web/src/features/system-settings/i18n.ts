import i18n from '@/i18n/config'

export const systemSettingsI18nResources = {
  en: {
    translation: {
      'Gift Quota Expiration': 'Gift Quota Expiration',
      'Check-in gift quota expiration': 'Check-in gift quota expiration',
      'Top-up bonus quota expiration': 'Top-up bonus quota expiration',
      'Enter a valid duration': 'Enter a valid duration',
      'Expiration policy': 'Expiration policy',
      Permanent: 'Permanent',
      'Fixed duration': 'Fixed duration',
      'Validity period': 'Validity period',
      Days: 'Days',
      Months: 'Months',
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
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        'Limit which clients can use each group. A group with no client selected is unrestricted.',
      'No client restrictions configured': 'No client restrictions configured',
      'Add a group to allow only specific clients to use it.':
        'Add a group to allow only specific clients to use it.',
      Unrestricted: 'Unrestricted',
      'Allowed clients for {{group}}': 'Allowed clients for {{group}}',
      'Image spec price': 'Image spec price',
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.',
      'Image spec prices': 'Image spec prices',
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.',
      'Spec key': 'Spec key',
      'per image': 'per image',
      'Add spec': 'Add spec',
      'Spec key is required': 'Spec key is required',
      'Duplicate spec key': 'Duplicate spec key',
      'Image spec price must be finite and non-negative':
        'Image spec price must be finite and non-negative',
      'Fallback price is required when image spec prices are set.':
        'Fallback price is required when image spec prices are set.',
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.',
      'image specs': 'image specs',
      'Includes resolution/quality prices':
        'Includes resolution/quality prices',
      'Subscription unlock': 'Subscription unlock',
      'Unlocked by subscription for {{group}}':
        'Unlocked by subscription for {{group}}',
      'Subscribers only': 'Subscribers only',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.',
    },
  },
  zhCN: {
    translation: {
      'Gift Quota Expiration': '赠送额度有效期',
      'Check-in gift quota expiration': '签到赠送额度有效期',
      'Top-up bonus quota expiration': '充值赠送额度有效期',
      'Enter a valid duration': '请输入有效的有效期',
      'Expiration policy': '有效期方式',
      Permanent: '永久',
      'Fixed duration': '固定时长',
      'Validity period': '有效期时长',
      Days: '天',
      Months: '个月',
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
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        '限制每个分组可使用的客户端。未选择任何客户端的分组不受限制。',
      'No client restrictions configured': '尚未配置客户端限制',
      'Add a group to allow only specific clients to use it.':
        '添加分组，仅允许指定客户端使用。',
      Unrestricted: '不限制',
      'Allowed clients for {{group}}': '{{group}} 允许的客户端',
      'Image spec price': '图片规格价格',
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        '模型到分辨率/画质单价的 JSON 映射。覆盖 ModelPrice；查找顺序为 resolution/quality、resolution，然后 quality。',
      'Image spec prices': '图片规格价格',
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        '叠加在保底单价上。查找顺序为 resolution/quality、resolution，然后 quality。',
      'Spec key': '规格键',
      'per image': '每张',
      'Add spec': '添加规格',
      'Spec key is required': '必须填写规格键',
      'Duplicate spec key': '规格键不能重复',
      'Image spec price must be finite and non-negative':
        '图片规格价格必须为有限非负数',
      'Fallback price is required when image spec prices are set.':
        '已设置图片规格价格时必须填写保底单价。',
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        '每次请求的美元价格，与 token 用量无关。未匹配到图片规格时使用该保底价。',
      'image specs': '图片规格',
      'Includes resolution/quality prices': '包含分辨率/画质价格',
      'Subscription unlock': '订阅解锁',
      'Unlocked by subscription for {{group}}': '对 {{group}} 订阅后可见',
      'Subscribers only': '仅限订阅用户',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        'sub: 规则（订阅解锁）会让该分组保持隐藏，直到用户拥有有效订阅，且该订阅的“允许分组”中明确列出了它。“允许分组”为空不会解锁，使用该分组时只会从订阅中扣费。',
    },
  },
  zhTW: {
    translation: {
      'Gift Quota Expiration': '贈送額度有效期',
      'Check-in gift quota expiration': '簽到贈送額度有效期',
      'Top-up bonus quota expiration': '儲值贈送額度有效期',
      'Enter a valid duration': '請輸入有效的有效期',
      'Expiration policy': '有效期方式',
      Permanent: '永久',
      'Fixed duration': '固定時長',
      'Validity period': '有效期時長',
      Days: '天',
      Months: '個月',
      'Client restrictions': '客戶端限制',
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        '限制每個分組可使用的客戶端。未選擇任何客戶端的分組不受限制。',
      'No client restrictions configured': '尚未設定客戶端限制',
      'Add a group to allow only specific clients to use it.':
        '新增分組，僅允許指定客戶端使用。',
      Unrestricted: '不限制',
      'Allowed clients for {{group}}': '{{group}} 允許的客戶端',
      'Image spec price': '圖片規格價格',
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        '模型到解析度／畫質單價的 JSON 對應。覆蓋 ModelPrice；查找順序為 resolution/quality、resolution，然後 quality。',
      'Image spec prices': '圖片規格價格',
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        '疊加在保底單價上。查找順序為 resolution/quality、resolution，然後 quality。',
      'Spec key': '規格鍵',
      'per image': '每張',
      'Add spec': '新增規格',
      'Spec key is required': '必須填寫規格鍵',
      'Duplicate spec key': '規格鍵不可重複',
      'Image spec price must be finite and non-negative':
        '圖片規格價格必須為有限非負數',
      'Fallback price is required when image spec prices are set.':
        '已設定圖片規格價格時必須填寫保底單價。',
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        '每次請求的美元價格，與 token 用量無關。未匹配到圖片規格時使用該保底價。',
      'image specs': '圖片規格',
      'Includes resolution/quality prices': '包含解析度／畫質價格',
      'Subscription unlock': '訂閱解鎖',
      'Unlocked by subscription for {{group}}': '對 {{group}} 訂閱後可見',
      'Subscribers only': '僅限訂閱用戶',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        'sub: 規則（訂閱解鎖）會讓該分組保持隱藏，直到用戶擁有有效訂閱，且該訂閱的「允許分組」中明確列出了它。「允許分組」為空不會解鎖，使用該分組時只會從訂閱中扣費。',
    },
  },
  fr: {
    translation: {
      'Gift Quota Expiration': 'Expiration du quota offert',
      'Check-in gift quota expiration':
        'Expiration du quota offert par pointage',
      'Top-up bonus quota expiration': 'Expiration du quota bonus de recharge',
      'Enter a valid duration': 'Saisissez une durée valide',
      'Expiration policy': "Mode d'expiration",
      Permanent: 'Permanent',
      'Fixed duration': 'Durée fixe',
      'Validity period': 'Durée de validité',
      Days: 'Jours',
      Months: 'Mois',
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
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        'Limitez les clients pouvant utiliser chaque groupe. Un groupe sans client sélectionné n’est pas restreint.',
      'No client restrictions configured':
        'Aucune restriction de client configurée',
      'Add a group to allow only specific clients to use it.':
        'Ajoutez un groupe pour n’autoriser que certains clients à l’utiliser.',
      Unrestricted: 'Non restreint',
      'Allowed clients for {{group}}': 'Clients autorisés pour {{group}}',
      'Image spec price': "Prix par spécification d'image",
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        'Objet JSON modèle → prix par résolution/qualité. Superpose ModelPrice ; ordre : resolution/quality, puis resolution, puis quality.',
      'Image spec prices': "Prix par spécification d'image",
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        'Superpose le prix de repli. Ordre : resolution/quality, puis resolution, puis quality.',
      'Spec key': 'Clé de spécification',
      'per image': 'par image',
      'Add spec': 'Ajouter une spécification',
      'Spec key is required': 'La clé de spécification est obligatoire',
      'Duplicate spec key': 'Clé de spécification en double',
      'Image spec price must be finite and non-negative':
        "Le prix de spécification d'image doit être fini et non négatif",
      'Fallback price is required when image spec prices are set.':
        "Un prix de repli est requis lorsque des prix par spécification d'image sont définis.",
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        "Coût en USD par requête, indépendamment des tokens. Utilisé comme repli si aucune spécification d'image ne correspond.",
      'image specs': "spécifications d'image",
      'Includes resolution/quality prices':
        'Inclut les prix par résolution/qualité',
      'Subscription unlock': 'Via abonnement',
      'Unlocked by subscription for {{group}}':
        'Débloqué par abonnement pour {{group}}',
      'Subscribers only': 'Réservé aux abonnés',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        "Une règle sub: (Via abonnement) garde le groupe masqué tant que l'utilisateur n'a pas d'abonnement actif dont les Groupes autorisés le listent explicitement. Une liste de Groupes autorisés vide ne le débloque pas, et l'utilisation de ce groupe n'est facturée que sur l'abonnement.",
    },
  },
  ja: {
    translation: {
      'Gift Quota Expiration': '付与クォータの有効期限',
      'Check-in gift quota expiration': 'チェックイン付与クォータの有効期限',
      'Top-up bonus quota expiration': 'チャージ特典クォータの有効期限',
      'Enter a valid duration': '有効な期間を入力してください',
      'Expiration policy': '有効期限の設定',
      Permanent: '無期限',
      'Fixed duration': '期間を設定',
      'Validity period': '有効期間',
      Days: '日',
      Months: 'か月',
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
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        'グループごとに使用できるクライアントを制限します。クライアントを選択していないグループは制限されません。',
      'No client restrictions configured':
        'クライアント制限は設定されていません',
      'Add a group to allow only specific clients to use it.':
        'グループを追加して、特定のクライアントだけが使えるようにします。',
      Unrestricted: '制限なし',
      'Allowed clients for {{group}}': '{{group}} の許可クライアント',
      'Image spec price': '画像スペック価格',
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        'モデルから解像度／品質単価への JSON マップです。ModelPrice を上書きし、検索順は resolution/quality、resolution、quality です。',
      'Image spec prices': '画像スペック価格',
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        'フォールバック単価の上に重ねます。検索順は resolution/quality、resolution、quality です。',
      'Spec key': 'スペックキー',
      'per image': '/枚',
      'Add spec': 'スペックを追加',
      'Spec key is required': 'スペックキーは必須です',
      'Duplicate spec key': 'スペックキーが重複しています',
      'Image spec price must be finite and non-negative':
        '画像スペック価格は有限の非負数である必要があります',
      'Fallback price is required when image spec prices are set.':
        '画像スペック価格を設定する場合はフォールバック単価が必要です。',
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        'トークン数に関係なく、リクエストあたりの USD 価格です。画像スペックに一致しない場合のフォールバック単価として使います。',
      'image specs': '画像スペック',
      'Includes resolution/quality prices': '解像度／品質価格を含む',
      'Subscription unlock': 'サブスクで解放',
      'Unlocked by subscription for {{group}}':
        '{{group}} にサブスクリプションで解放',
      'Subscribers only': 'サブスクリプション利用者限定',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        'sub: ルール（サブスクで解放）は、有効なサブスクリプションの許可グループにこのグループが明示的に含まれるまで、グループを非表示のままにします。許可グループが空の場合は解放されず、このグループの利用料金はサブスクリプションからのみ差し引かれます。',
    },
  },
  ru: {
    translation: {
      'Gift Quota Expiration': 'Срок действия подарочной квоты',
      'Check-in gift quota expiration':
        'Срок действия квоты за ежедневную отметку',
      'Top-up bonus quota expiration':
        'Срок действия бонусной квоты пополнения',
      'Enter a valid duration': 'Укажите корректный срок',
      'Expiration policy': 'Режим срока действия',
      Permanent: 'Бессрочно',
      'Fixed duration': 'Ограниченный срок',
      'Validity period': 'Срок действия',
      Days: 'Дни',
      Months: 'Месяцы',
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
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        'Ограничьте клиентов, которые могут использовать каждую группу. Группа без выбранных клиентов не ограничивается.',
      'No client restrictions configured': 'Ограничения клиентов не настроены',
      'Add a group to allow only specific clients to use it.':
        'Добавьте группу, чтобы разрешить её использование только определённым клиентам.',
      Unrestricted: 'Без ограничений',
      'Allowed clients for {{group}}': 'Разрешённые клиенты для {{group}}',
      'Image spec price': 'Цена по спецификации изображения',
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        'JSON-объект модели к ценам по разрешению/качеству. Перекрывает ModelPrice; порядок поиска: resolution/quality, затем resolution, затем quality.',
      'Image spec prices': 'Цены по спецификации изображения',
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        'Наложение на резервную цену. Порядок поиска: resolution/quality, затем resolution, затем quality.',
      'Spec key': 'Ключ спецификации',
      'per image': 'за изображение',
      'Add spec': 'Добавить спецификацию',
      'Spec key is required': 'Ключ спецификации обязателен',
      'Duplicate spec key': 'Дублирующийся ключ спецификации',
      'Image spec price must be finite and non-negative':
        'Цена спецификации изображения должна быть конечной и неотрицательной',
      'Fallback price is required when image spec prices are set.':
        'При заданных ценах по спецификации изображения требуется резервная цена.',
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        'Стоимость в USD за запрос независимо от токенов. Используется как резервная цена, если спецификация изображения не совпала.',
      'image specs': 'спецификации изображения',
      'Includes resolution/quality prices':
        'Включает цены по разрешению/качеству',
      'Subscription unlock': 'По подписке',
      'Unlocked by subscription for {{group}}':
        'Открыта по подписке для {{group}}',
      'Subscribers only': 'Только для подписчиков',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        'Правило sub: (По подписке) скрывает группу, пока у пользователя нет активной подписки, в разрешённых группах которой она указана явно. Пустой список разрешённых групп не открывает доступ, а использование этой группы оплачивается только за счёт подписки.',
    },
  },
  vi: {
    translation: {
      'Gift Quota Expiration': 'Thời hạn hạn mức được tặng',
      'Check-in gift quota expiration': 'Thời hạn hạn mức tặng khi điểm danh',
      'Top-up bonus quota expiration': 'Thời hạn hạn mức thưởng nạp tiền',
      'Enter a valid duration': 'Nhập thời hạn hợp lệ',
      'Expiration policy': 'Cách hết hạn',
      Permanent: 'Vĩnh viễn',
      'Fixed duration': 'Thời hạn cố định',
      'Validity period': 'Thời hạn hiệu lực',
      Days: 'Ngày',
      Months: 'Tháng',
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
      'Limit which clients can use each group. A group with no client selected is unrestricted.':
        'Giới hạn client được dùng cho từng nhóm. Nhóm chưa chọn client nào sẽ không bị giới hạn.',
      'No client restrictions configured': 'Chưa cấu hình giới hạn client',
      'Add a group to allow only specific clients to use it.':
        'Thêm nhóm để chỉ cho phép một số client nhất định sử dụng.',
      Unrestricted: 'Không giới hạn',
      'Allowed clients for {{group}}': 'Client được phép cho {{group}}',
      'Image spec price': 'Giá theo thông số ảnh',
      'JSON map of model → resolution/quality prices. Overlay on ModelPrice; lookup order is resolution/quality, then resolution, then quality.':
        'Bản đồ JSON từ mô hình tới giá theo độ phân giải/chất lượng. Ghi đè ModelPrice; thứ tự tra cứu là resolution/quality, rồi resolution, rồi quality.',
      'Image spec prices': 'Giá theo thông số ảnh',
      'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.':
        'Ghi đè lên giá dự phòng. Thứ tự tra cứu là resolution/quality, rồi resolution, rồi quality.',
      'Spec key': 'Khóa thông số',
      'per image': 'mỗi ảnh',
      'Add spec': 'Thêm thông số',
      'Spec key is required': 'Bắt buộc nhập khóa thông số',
      'Duplicate spec key': 'Khóa thông số bị trùng',
      'Image spec price must be finite and non-negative':
        'Giá theo thông số ảnh phải là số hữu hạn không âm',
      'Fallback price is required when image spec prices are set.':
        'Cần giá dự phòng khi đã đặt giá theo thông số ảnh.',
      'Cost in USD per request, regardless of tokens used. Used as the fallback when no image spec matches.':
        'Chi phí USD mỗi yêu cầu, không phụ thuộc token. Dùng làm giá dự phòng khi không khớp thông số ảnh.',
      'image specs': 'thông số ảnh',
      'Includes resolution/quality prices':
        'Bao gồm giá theo độ phân giải/chất lượng',
      'Subscription unlock': 'Mở khóa qua đăng ký',
      'Unlocked by subscription for {{group}}':
        'Mở khóa qua đăng ký cho {{group}}',
      'Subscribers only': 'Chỉ dành cho người đăng ký',
      'A sub: rule (Subscription unlock) keeps the group hidden until the user has an active subscription whose Allowed Groups explicitly list it. An empty Allowed Groups list does not unlock it, and usage of that group is billed only from the subscription.':
        'Quy tắc sub: (Mở khóa qua đăng ký) giữ nhóm ở trạng thái ẩn cho đến khi người dùng có đăng ký còn hiệu lực mà mục Nhóm được phép liệt kê rõ nhóm đó. Danh sách Nhóm được phép để trống sẽ không mở khóa, và việc dùng nhóm này chỉ được tính phí từ đăng ký.',
    },
  },
} as const

for (const [language, resource] of Object.entries(
  systemSettingsI18nResources
)) {
  i18n.addResourceBundle(
    language,
    'translation',
    resource.translation,
    true,
    true
  )
}
