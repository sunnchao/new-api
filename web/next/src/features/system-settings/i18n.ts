import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'AI coding documentation and tool guides.':
        'AI coding documentation and tool guides.',
      'Public page with support contact information.':
        'Public page with support contact information.',
      'Public subscription plan catalog.': 'Public subscription plan catalog.',
      'Require login to view subscription plans':
        'Require login to view subscription plans',
      'Visitors must authenticate before accessing subscription plans.':
        'Visitors must authenticate before accessing subscription plans.',
      'Maximum Tokens per User': 'Maximum Tokens per User',
      'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.':
        'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.',
      'Legacy dashboard settings detected':
        'Legacy dashboard settings detected',
      'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.':
        'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.',
      'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.':
        'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.',
      'Migrating...': 'Migrating...',
      'Migrate settings': 'Migrate settings',
      'Legacy settings migrated successfully':
        'Legacy settings migrated successfully',
      'Failed to migrate legacy settings':
        'Failed to migrate legacy settings',
      'Channel Affinity: Upstream Cache Hit':
        'Channel Affinity: Upstream Cache Hit',
      'Hit criteria: If cached tokens exist in usage, it counts as a hit.':
        'Hit criteria: If cached tokens exist in usage, it counts as a hit.',
      'Cached token rates use the backend rate mode.':
        'Cached token rates use the backend rate mode.',
      'This record does not include a supported token statistics mode.':
        'This record does not include a supported token statistics mode.',
      'Prompt tokens': 'Prompt tokens',
      'Cached tokens': 'Cached tokens',
      'Prompt cache hit tokens': 'Prompt cache hit tokens',
      'Completion tokens': 'Completion tokens',
      'Total tokens': 'Total tokens',
      'Next.js Frontend': 'Next.js Frontend',
      'Client restrictions': 'Client restrictions',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.',
      'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.':
        'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.',
    },
  },
  zh: {
    translation: {
      'AI coding documentation and tool guides.': 'AI 编程文档和工具指南。',
      'Public page with support contact information.':
        '展示支持联系方式的公开页面。',
      'Public subscription plan catalog.': '公开订阅套餐目录。',
      'Require login to view subscription plans': '要求登录才能查看订阅套餐',
      'Visitors must authenticate before accessing subscription plans.':
        '访客必须登录后才能访问订阅套餐。',
      'Maximum Tokens per User': '用户最大令牌数量',
      'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.':
        '每个用户最多可创建的 API 密钥数量。默认 1000，设置过大可能影响性能。',
      'Legacy dashboard settings detected': '检测到旧版仪表盘设置',
      'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.':
        '检测到旧版仪表盘内容设置。请先迁移到新的 console_setting 格式，再编辑这些设置。',
      'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.':
        '迁移会转换 API 地址、公告、FAQ 和 Uptime Kuma 设置，然后清理旧配置键。继续前请先备份旧配置值。',
      'Migrating...': '正在迁移...',
      'Migrate settings': '迁移设置',
      'Legacy settings migrated successfully': '旧版设置迁移成功',
      'Failed to migrate legacy settings': '迁移旧版设置失败',
      'Channel Affinity: Upstream Cache Hit': '渠道亲和性：上游缓存命中',
      'Hit criteria: If cached tokens exist in usage, it counts as a hit.':
        '命中判定：usage 中存在 cached tokens 即视为命中。',
      'Cached token rates use the backend rate mode.':
        'Cached token 占比使用后端返回的计算口径。',
      'This record does not include a supported token statistics mode.':
        '该记录不包含受支持的 token 统计口径。',
      'Prompt tokens': '提示词 tokens',
      'Cached tokens': '缓存 tokens',
      'Prompt cache hit tokens': '提示词缓存命中 tokens',
      'Completion tokens': '补全 tokens',
      'Total tokens': '总 tokens',
      'Next.js Frontend': 'Next.js 前端',
      'Client restrictions': '客户端限制',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        '分组到允许客户端的 JSON 映射。允许的客户端 ID 为 claude_code 和 codex；未配置或空列表的分组不限制。',
      'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.':
        '在默认、经典和 Next.js 前端之间切换。Next.js 选项需要配置 NEXT_FRONTEND_BASE_URL 或 FRONTEND_NEXT_BASE_URL 指向正在运行的 Next 服务。',
    },
  },
  fr: {
    translation: {
      'AI coding documentation and tool guides.':
        "Documentation de codage IA et guides d'outils.",
      'Public page with support contact information.':
        'Page publique avec les informations de contact du support.',
      'Public subscription plan catalog.': 'Catalogue public des abonnements.',
      'Require login to view subscription plans':
        'Exiger la connexion pour voir les abonnements',
      'Visitors must authenticate before accessing subscription plans.':
        'Les visiteurs doivent se connecter avant d’acceder aux abonnements.',
      'Maximum Tokens per User': 'Nombre maximal de jetons par utilisateur',
      'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.':
        'Nombre maximal de cles API que chaque utilisateur peut creer. La valeur par defaut est 1000 ; des valeurs tres elevees peuvent affecter les performances.',
      'Legacy dashboard settings detected':
        'Anciens parametres du tableau de bord detectes',
      'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.':
        'Des anciens parametres de contenu du tableau de bord ont ete detectes. Migrez-les vers le nouveau format console_setting avant de modifier ces sections.',
      'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.':
        'La migration convertit les adresses API, annonces, FAQ et parametres Uptime Kuma, puis efface les anciennes cles. Sauvegardez les anciennes valeurs avant de continuer.',
      'Migrating...': 'Migration...',
      'Migrate settings': 'Migrer les parametres',
      'Legacy settings migrated successfully':
        'Anciens parametres migres avec succes',
      'Failed to migrate legacy settings':
        'Echec de la migration des anciens parametres',
      'Channel Affinity: Upstream Cache Hit':
        'Affinite de canal : cache upstream touche',
      'Hit criteria: If cached tokens exist in usage, it counts as a hit.':
        "Critere de hit : si des tokens mis en cache existent dans l'usage, cela compte comme un hit.",
      'Cached token rates use the backend rate mode.':
        'Les taux de tokens en cache utilisent le mode de calcul renvoye par le backend.',
      'This record does not include a supported token statistics mode.':
        'Cet enregistrement ne contient pas de mode de statistiques de tokens pris en charge.',
      'Prompt tokens': 'Tokens de prompt',
      'Cached tokens': 'Tokens en cache',
      'Prompt cache hit tokens': 'Tokens de prompt touches par le cache',
      'Completion tokens': 'Tokens de completion',
      'Total tokens': 'Total des tokens',
      'Next.js Frontend': 'Frontend Next.js',
      'Client restrictions': 'Restrictions de client',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'Objet JSON associant chaque groupe aux clients autorisés. Les IDs autorisés sont claude_code et codex ; les groupes absents ou vides ne sont pas restreints.',
      'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.':
        "Basculez entre les frontends default, classic et Next.js. L'option Next.js nécessite que NEXT_FRONTEND_BASE_URL ou FRONTEND_NEXT_BASE_URL pointe vers un service Next en cours d'exécution.",
    },
  },
  ja: {
    translation: {
      'AI coding documentation and tool guides.':
        'AI コーディングのドキュメントとツールガイド。',
      'Public page with support contact information.':
        'サポート連絡先を表示する公開ページ。',
      'Public subscription plan catalog.':
        '公開サブスクリプションプランカタログ。',
      'Require login to view subscription plans':
        'サブスクリプションプランの表示にログインを要求する',
      'Visitors must authenticate before accessing subscription plans.':
        '訪問者はサブスクリプションプランにアクセスする前に認証する必要があります。',
      'Maximum Tokens per User': 'ユーザーごとの最大トークン数',
      'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.':
        '各ユーザーが作成できる API キーの最大数です。既定値は 1000 で、大きすぎる値はパフォーマンスに影響する場合があります。',
      'Legacy dashboard settings detected':
        '旧ダッシュボード設定が検出されました',
      'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.':
        '旧ダッシュボードのコンテンツ設定が検出されました。これらのセクションを編集する前に、新しい console_setting 形式へ移行してください。',
      'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.':
        '移行では API アドレス、お知らせ、FAQ、Uptime Kuma 設定を変換し、古いオプションキーを削除します。続行前に旧設定値をバックアップしてください。',
      'Migrating...': '移行中...',
      'Migrate settings': '設定を移行',
      'Legacy settings migrated successfully': '旧設定を移行しました',
      'Failed to migrate legacy settings': '旧設定の移行に失敗しました',
      'Channel Affinity: Upstream Cache Hit':
        'チャネルアフィニティ：上流キャッシュヒット',
      'Hit criteria: If cached tokens exist in usage, it counts as a hit.':
        'ヒット判定：usage に cached tokens が存在すればヒットとみなします。',
      'Cached token rates use the backend rate mode.':
        'キャッシュ token 率はバックエンドが返す計算モードを使用します。',
      'This record does not include a supported token statistics mode.':
        'この記録には対応する token 統計モードが含まれていません。',
      'Prompt tokens': 'プロンプト tokens',
      'Cached tokens': 'キャッシュ tokens',
      'Prompt cache hit tokens': 'プロンプトキャッシュヒット tokens',
      'Completion tokens': '補完 tokens',
      'Total tokens': '合計 tokens',
      'Next.js Frontend': 'Next.js フロントエンド',
      'Client restrictions': 'クライアント制限',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'グループから許可クライアントへの JSON マップです。許可されるクライアント ID は claude_code と codex です。未設定または空のグループは制限されません。',
      'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.':
        'default、classic、Next.js の各フロントエンドを切り替えます。Next.js オプションでは、実行中の Next サービスを指す NEXT_FRONTEND_BASE_URL または FRONTEND_NEXT_BASE_URL が必要です。',
    },
  },
  ru: {
    translation: {
      'AI coding documentation and tool guides.':
        'Документация по AI-кодингу и руководства по инструментам.',
      'Public page with support contact information.':
        'Публичная страница с контактами поддержки.',
      'Public subscription plan catalog.': 'Публичный каталог подписок.',
      'Require login to view subscription plans':
        'Требовать вход для просмотра подписок',
      'Visitors must authenticate before accessing subscription plans.':
        'Посетители должны войти в систему перед доступом к подпискам.',
      'Maximum Tokens per User':
        'Максимальное количество токенов на пользователя',
      'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.':
        'Максимальное количество API-ключей, которое может создать каждый пользователь. По умолчанию 1000; слишком большие значения могут влиять на производительность.',
      'Legacy dashboard settings detected':
        'Обнаружены устаревшие настройки панели',
      'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.':
        'Обнаружены устаревшие настройки содержимого панели. Перенесите их в новый формат console_setting перед редактированием этих разделов.',
      'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.':
        'Миграция преобразует адреса API, объявления, FAQ и настройки Uptime Kuma, затем очищает старые ключи. Перед продолжением сделайте резервную копию старых значений.',
      'Migrating...': 'Миграция...',
      'Migrate settings': 'Перенести настройки',
      'Legacy settings migrated successfully':
        'Устаревшие настройки успешно перенесены',
      'Failed to migrate legacy settings':
        'Не удалось перенести устаревшие настройки',
      'Channel Affinity: Upstream Cache Hit':
        'Привязка к каналу: попадание в upstream-кэш',
      'Hit criteria: If cached tokens exist in usage, it counts as a hit.':
        'Критерий попадания: если в usage есть кэшированные токены, это считается попаданием.',
      'Cached token rates use the backend rate mode.':
        'Доля кэшированных токенов рассчитывается по режиму, возвращенному backend.',
      'This record does not include a supported token statistics mode.':
        'Эта запись не содержит поддерживаемого режима статистики токенов.',
      'Prompt tokens': 'Токены prompt',
      'Cached tokens': 'Кэшированные токены',
      'Prompt cache hit tokens': 'Токены prompt с попаданием в кэш',
      'Completion tokens': 'Токены completion',
      'Total tokens': 'Всего токенов',
      'Next.js Frontend': 'Фронтенд Next.js',
      'Client restrictions': 'Ограничения клиентов',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'JSON-объект, сопоставляющий группы с разрешенными клиентами. Допустимые ID клиентов: claude_code и codex; отсутствующие группы или пустые списки не ограничиваются.',
      'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.':
        'Переключение между фронтендами default, classic и Next.js. Для варианта Next.js требуется NEXT_FRONTEND_BASE_URL или FRONTEND_NEXT_BASE_URL, указывающий на запущенный сервис Next.',
    },
  },
  vi: {
    translation: {
      'AI coding documentation and tool guides.':
        'Tài liệu lập trình AI và hướng dẫn công cụ.',
      'Public page with support contact information.':
        'Trang công khai hiển thị thông tin liên hệ hỗ trợ.',
      'Public subscription plan catalog.': 'Danh mục gói đăng ký công khai.',
      'Require login to view subscription plans':
        'Yêu cầu đăng nhập để xem gói đăng ký',
      'Visitors must authenticate before accessing subscription plans.':
        'Khách truy cập phải xác thực trước khi xem các gói đăng ký.',
      'Maximum Tokens per User': 'Số token tối đa cho mỗi người dùng',
      'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.':
        'Số khóa API tối đa mỗi người dùng có thể tạo. Mặc định là 1000; giá trị quá lớn có thể ảnh hưởng đến hiệu năng.',
      'Legacy dashboard settings detected':
        'Đã phát hiện cài đặt bảng điều khiển cũ',
      'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.':
        'Đã phát hiện cài đặt nội dung bảng điều khiển cũ. Hãy chuyển chúng sang định dạng console_setting mới trước khi chỉnh sửa các mục này.',
      'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.':
        'Quá trình chuyển đổi sẽ chuyển địa chỉ API, thông báo, FAQ và cài đặt Uptime Kuma, rồi xóa các khóa tùy chọn cũ. Hãy sao lưu giá trị cũ trước khi tiếp tục.',
      'Migrating...': 'Đang chuyển đổi...',
      'Migrate settings': 'Chuyển đổi cài đặt',
      'Legacy settings migrated successfully':
        'Đã chuyển đổi cài đặt cũ thành công',
      'Failed to migrate legacy settings':
        'Không thể chuyển đổi cài đặt cũ',
      'Channel Affinity: Upstream Cache Hit':
        'Ưu tiên kênh: cache hit từ upstream',
      'Hit criteria: If cached tokens exist in usage, it counts as a hit.':
        'Tiêu chí trúng: nếu usage có cached tokens thì được tính là trúng.',
      'Cached token rates use the backend rate mode.':
        'Tỷ lệ token được cache dùng chế độ tính do backend trả về.',
      'This record does not include a supported token statistics mode.':
        'Bản ghi này không có chế độ thống kê token được hỗ trợ.',
      'Prompt tokens': 'Token prompt',
      'Cached tokens': 'Token được cache',
      'Prompt cache hit tokens': 'Token prompt trúng cache',
      'Completion tokens': 'Token completion',
      'Total tokens': 'Tổng token',
      'Next.js Frontend': 'Frontend Next.js',
      'Client restrictions': 'Giới hạn client',
      'JSON map of group to allowed clients. Allowed client IDs are claude_code and codex; missing or empty groups are unrestricted.':
        'Bản đồ JSON từ nhóm sang các client được phép. ID client hợp lệ là claude_code và codex; nhóm bị thiếu hoặc có danh sách rỗng sẽ không bị giới hạn.',
      'Switch between default, classic, and Next.js frontends. The Next.js option requires NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL to point at a running Next server.':
        'Chuyển đổi giữa các frontend default, classic và Next.js. Tùy chọn Next.js cần NEXT_FRONTEND_BASE_URL hoặc FRONTEND_NEXT_BASE_URL trỏ tới dịch vụ Next đang chạy.',
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
