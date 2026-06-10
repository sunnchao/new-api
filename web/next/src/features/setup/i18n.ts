import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Administrator account': 'Administrator account',
      'Administrator username': 'Administrator username',
      Back: 'Back',
      'Best for single-tenant deployments. Pricing and billing options stay hidden.':
        'Best for single-tenant deployments. Pricing and billing options stay hidden.',
      'Choose a username': 'Choose a username',
      'Choose how the platform will operate':
        'Choose how the platform will operate',
      'Complete these steps to finish the initial installation.':
        'Complete these steps to finish the initial installation.',
      'Confirm password': 'Confirm password',
      'Confirm settings and finish setup':
        'Confirm settings and finish setup',
      'Create credentials for the root user':
        'Create credentials for the root user',
      'Custom database driver detected.': 'Custom database driver detected.',
      'Data directory:': 'Data directory:',
      'Data is stored locally on this device. Use system backups to keep a safe copy.':
        'Data is stored locally on this device. Use system backups to keep a safe copy.',
      Database: 'Database',
      'Database check': 'Database check',
      'Demo site': 'Demo site',
      'Demo site mode': 'Demo site mode',
      'Detected database': 'Detected database',
      'Double check the configuration below. Your system will be locked until initialization is complete.':
        'Double check the configuration below. Your system will be locked until initialization is complete.',
      'Existing account will be reused': 'Existing account will be reused',
      'External operations': 'External operations',
      'External operations mode': 'External operations mode',
      'Failed to initialize system': 'Failed to initialize system',
      'Failed to load setup status': 'Failed to load setup status',
      'Follow the guided steps to prepare your workspace before the first login.':
        'Follow the guided steps to prepare your workspace before the first login.',
      'How will you use the platform?': 'How will you use the platform?',
      Initialization: 'Initialization',
      'Initialization failed, please try again.':
        'Initialization failed, please try again.',
      Initialize: 'Initialize',
      'Initialize system': 'Initialize system',
      'Initializing…': 'Initializing…',
      'Loading setup status…': 'Loading setup status…',
      'MySQL detected': 'MySQL detected',
      'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.':
        'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.',
      'MySQL is a production-ready relational database. Keep your credentials secure.':
        'MySQL is a production-ready relational database. Keep your credentials secure.',
      Next: 'Next',
      'Not set yet': 'Not set yet',
      Password: 'Password',
      'Password must be at least 8 characters long':
        'Password must be at least 8 characters long',
      'Passwords do not match': 'Passwords do not match',
      'Persist your data file': 'Persist your data file',
      'Personal use': 'Personal use',
      'Personal use mode': 'Personal use mode',
      'Please enter an administrator username':
        'Please enter an administrator username',
      'PostgreSQL detected': 'PostgreSQL detected',
      'PostgreSQL offers advanced reliability and data integrity for production workloads.':
        'PostgreSQL offers advanced reliability and data integrity for production workloads.',
      'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.':
        'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.',
      'Ready to initialize': 'Ready to initialize',
      'Repeat the administrator password':
        'Repeat the administrator password',
      'Review & initialize': 'Review & initialize',
      'Select a usage mode to continue': 'Select a usage mode to continue',
      'Serve multiple users or teams with billing and quota control.':
        'Serve multiple users or teams with billing and quota control.',
      'Set a secure password (min. 8 characters)':
        'Set a secure password (min. 8 characters)',
      'Showcase core capabilities with demo credentials and limited access.':
        'Showcase core capabilities with demo credentials and limited access.',
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.':
        'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.',
      'System initialized successfully! Redirecting…':
        'System initialized successfully! Redirecting…',
      'System logo': 'System logo',
      'System setup wizard': 'System setup wizard',
      'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.':
        'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.',
      'The setup wizard will use this database during initialization.':
        'The setup wizard will use this database during initialization.',
      Unknown: 'Unknown',
      'Usage mode': 'Usage mode',
      'Verify your database connection': 'Verify your database connection',
      'We could not load the setup status.':
        'We could not load the setup status.',
      'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.':
        'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.',
    },
  },
  zh: {
    translation: {
      'Administrator account': '管理员账户',
      'Administrator username': '管理员用户名',
      Back: '返回',
      'Best for single-tenant deployments. Pricing and billing options stay hidden.':
        '适合单用户部署。定价和计费选项将被隐藏。',
      'Choose a username': '选择一个用户名',
      'Choose how the platform will operate': '选择平台的运行模式',
      'Complete these steps to finish the initial installation.':
        '完成这些步骤以完成初始安装。',
      'Confirm password': '确认密码',
      'Confirm settings and finish setup': '确认设置并完成安装',
      'Create credentials for the root user': '为管理员创建登录凭据',
      'Custom database driver detected.': '检测到自定义数据库驱动。',
      'Data directory:': '数据目录：',
      'Data is stored locally on this device. Use system backups to keep a safe copy.':
        '数据存储在此设备本地。请使用系统备份来保留安全副本。',
      Database: '数据库',
      'Database check': '数据库检查',
      'Demo site': '演示站点',
      'Demo site mode': '演示站点模式',
      'Detected database': '检测到的数据库',
      'Double check the configuration below. Your system will be locked until initialization is complete.':
        '仔细检查以下配置。您的系统将在初始化完成前保持锁定状态。',
      'Existing account will be reused': '将使用现有账户',
      'External operations': '对外运营',
      'External operations mode': '对外运营模式',
      'Failed to initialize system': '系统初始化失败',
      'Failed to load setup status': '无法加载设置状态',
      'Follow the guided steps to prepare your workspace before the first login.':
        '请按照引导步骤在首次登录前准备您的工作区。',
      'How will you use the platform?': '您将如何使用本平台？',
      Initialization: '初始化',
      'Initialization failed, please try again.': '初始化失败，请重试。',
      Initialize: '初始化',
      'Initialize system': '初始化系统',
      'Initializing…': '正在初始化…',
      'Loading setup status…': '正在加载设置状态…',
      'MySQL detected': '检测到 MySQL',
      'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.':
        'MySQL 已准备好投入生产环境。请确保配置了自动备份以及具有最低所需权限的专用用户。',
      'MySQL is a production-ready relational database. Keep your credentials secure.':
        'MySQL 是生产就绪的关系数据库。请确保凭据安全。',
      Next: '下一步',
      'Not set yet': '尚未设置',
      Password: '密码',
      'Password must be at least 8 characters long':
        '密码必须至少 8 个字符长',
      'Passwords do not match': '密码不匹配',
      'Persist your data file': '持久化您的数据文件',
      'Personal use': '个人使用',
      'Personal use mode': '个人使用模式',
      'Please enter an administrator username': '请输入管理员用户名',
      'PostgreSQL detected': '检测到 PostgreSQL',
      'PostgreSQL offers advanced reliability and data integrity for production workloads.':
        'PostgreSQL 为生产工作负载提供高级可靠性和数据完整性。',
      'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.':
        'PostgreSQL 提供强大的可靠性保证。在上线之前，请仔细检查您的维护窗口和保留策略。',
      'Ready to initialize': '准备初始化',
      'Repeat the administrator password': '重复输入管理员密码',
      'Review & initialize': '审核并初始化',
      'Select a usage mode to continue': '选择使用模式以继续',
      'Serve multiple users or teams with billing and quota control.':
        '为多个用户或团队提供计费和配额管理服务。',
      'Set a secure password (min. 8 characters)':
        '设置安全密码（最少 8 个字符）',
      'Showcase core capabilities with demo credentials and limited access.':
        '使用演示凭据和有限访问权限展示核心功能。',
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.':
        'SQLite 将所有数据存储在单个文件中。在容器中运行时请确保该文件已持久化。',
      'System initialized successfully! Redirecting…':
        '系统初始化成功！正在重定向…',
      'System logo': '系统徽标',
      'System setup wizard': '系统设置向导',
      'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.':
        '管理员账户已初始化。您可以保留现有凭据并继续下一步。',
      'The setup wizard will use this database during initialization.':
        '设置向导将在初始化过程中使用此数据库。',
      Unknown: '未知',
      'Usage mode': '使用模式',
      'Verify your database connection': '验证数据库连接',
      'We could not load the setup status.': '我们无法加载设置状态。',
      'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.':
        '在容器或临时环境中运行时，请确保 SQLite 文件映射到持久存储，以避免重启时数据丢失。',
    },
  },
  fr: {
    translation: {
      'Administrator account': 'Compte administrateur',
      'Administrator username': "Nom d'utilisateur administrateur",
      Back: 'Retour',
      'Best for single-tenant deployments. Pricing and billing options stay hidden.':
        'Idéal pour les déploiements mono-utilisateur. Les options de tarification et de facturation restent masquées.',
      'Choose a username': "Choisir un nom d'utilisateur",
      'Choose how the platform will operate':
        'Choisissez le mode de fonctionnement de la plateforme',
      'Complete these steps to finish the initial installation.':
        "Suivez ces étapes pour terminer l'installation initiale.",
      'Confirm password': 'Confirmer le mot de passe',
      'Confirm settings and finish setup':
        'Confirmez les paramètres et terminez la configuration',
      'Create credentials for the root user':
        'Créer les identifiants pour le compte administrateur',
      'Custom database driver detected.':
        'Pilote de base de données personnalisé détecté.',
      'Data directory:': 'Répertoire des données :',
      'Data is stored locally on this device. Use system backups to keep a safe copy.':
        'Les données sont stockées localement sur cet appareil. Utilisez les sauvegardes système pour conserver une copie sécurisée.',
      Database: 'Base de données',
      'Database check': 'Vérification de la base de données',
      'Demo site': 'Site de démonstration',
      'Demo site mode': 'Mode site de démonstration',
      'Detected database': 'Base de données détectée',
      'Double check the configuration below. Your system will be locked until initialization is complete.':
        "Vérifiez la configuration ci-dessous. Votre système sera verrouillé jusqu'à ce que l'initialisation soit terminée.",
      'Existing account will be reused': 'Le compte existant sera réutilisé',
      'External operations': 'Opérations externes',
      'External operations mode': 'Mode opérations externes',
      'Failed to initialize system': "Échec de l'initialisation du système",
      'Failed to load setup status':
        "Échec du chargement de l'état de configuration",
      'Follow the guided steps to prepare your workspace before the first login.':
        'Suivez les étapes guidées pour préparer votre espace de travail avant la première connexion.',
      'How will you use the platform?':
        'Comment allez-vous utiliser la plateforme ?',
      Initialization: 'Initialisation',
      'Initialization failed, please try again.':
        "L'initialisation a échoué, veuillez réessayer.",
      Initialize: 'Initialiser',
      'Initialize system': 'Initialiser le système',
      'Initializing…': 'Initialisation…',
      'Loading setup status…': 'Chargement du statut de configuration…',
      'MySQL detected': 'MySQL détecté',
      'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.':
        'MySQL est prêt pour la production. Assurez-vous que des sauvegardes automatisées et un utilisateur dédié avec les privilèges minimaux requis sont configurés.',
      'MySQL is a production-ready relational database. Keep your credentials secure.':
        'MySQL est une base de données relationnelle prête pour la production. Gardez vos identifiants en sécurité.',
      Next: 'Suivant',
      'Not set yet': 'Non défini',
      Password: 'Mot de passe',
      'Password must be at least 8 characters long':
        'Le mot de passe doit comporter au moins 8 caractères',
      'Passwords do not match': 'Les mots de passe ne correspondent pas',
      'Persist your data file': 'Conserver votre fichier de données',
      'Personal use': 'Usage personnel',
      'Personal use mode': 'Mode usage personnel',
      'Please enter an administrator username':
        "Veuillez saisir un nom d'utilisateur administrateur",
      'PostgreSQL detected': 'PostgreSQL détecté',
      'PostgreSQL offers advanced reliability and data integrity for production workloads.':
        'PostgreSQL offre une fiabilité avancée et une intégrité des données pour les charges de travail en production.',
      'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.':
        'PostgreSQL offre de solides garanties de fiabilité. Vérifiez votre fenêtre de maintenance et vos politiques de rétention avant la mise en production.',
      'Ready to initialize': 'Prêt à initialiser',
      'Repeat the administrator password':
        'Répéter le mot de passe administrateur',
      'Review & initialize': 'Vérifier et initialiser',
      'Select a usage mode to continue':
        "Sélectionnez un mode d'utilisation pour continuer",
      'Serve multiple users or teams with billing and quota control.':
        'Servir plusieurs utilisateurs ou équipes avec gestion de la facturation et des quotas.',
      'Set a secure password (min. 8 characters)':
        'Définir un mot de passe sécurisé (min. 8 caractères)',
      'Showcase core capabilities with demo credentials and limited access.':
        'Présenter les fonctionnalités principales avec des identifiants de démonstration et un accès limité.',
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.':
        "SQLite stocke toutes les données dans un seul fichier. Assurez-vous que ce fichier est persisté lors de l'exécution dans des conteneurs.",
      'System initialized successfully! Redirecting…':
        'Système initialisé avec succès ! Redirection…',
      'System logo': 'Logo du système',
      'System setup wizard': 'Assistant de configuration du système',
      'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.':
        "Le compte administrateur est déjà initialisé. Vous pouvez conserver vos identifiants existants et passer à l'étape suivante.",
      'The setup wizard will use this database during initialization.':
        "L'assistant de configuration utilisera cette base de données lors de l'initialisation.",
      Unknown: 'Inconnu',
      'Usage mode': "Mode d'utilisation",
      'Verify your database connection':
        'Vérifiez votre connexion à la base de données',
      'We could not load the setup status.':
        "Nous n'avons pas pu charger l'état de la configuration.",
      'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.':
        "Lors de l'exécution dans des conteneurs ou des environnements éphémères, assurez-vous que le fichier SQLite est mappé à un stockage persistant pour éviter la perte de données au redémarrage.",
    },
  },
  ja: {
    translation: {
      'Administrator account': '管理者アカウント',
      'Administrator username': '管理者ユーザー名',
      Back: '戻る',
      'Best for single-tenant deployments. Pricing and billing options stay hidden.':
        'シングルテナント環境に最適です。料金設定や請求オプションは非表示になります。',
      'Choose a username': 'ユーザー名を選択',
      'Choose how the platform will operate':
        'プラットフォームの運用方法を選択',
      'Complete these steps to finish the initial installation.':
        '初期インストールを完了するには、これらの手順を完了してください。',
      'Confirm password': 'パスワードの確認',
      'Confirm settings and finish setup': '設定を確認してセットアップを完了',
      'Create credentials for the root user': '管理者アカウントの認証情報を作成',
      'Custom database driver detected.':
        'カスタムデータベースドライバーが検出されました。',
      'Data directory:': 'データディレクトリ:',
      'Data is stored locally on this device. Use system backups to keep a safe copy.':
        'データはこのデバイスにローカルに保存されます。安全なコピーを保持するためにシステムバックアップを使用してください。',
      Database: 'データベース',
      'Database check': 'データベース確認',
      'Demo site': 'デモサイト',
      'Demo site mode': 'デモサイトモード',
      'Detected database': '検出されたデータベース',
      'Double check the configuration below. Your system will be locked until initialization is complete.':
        '下記の設定を再確認してください。初期化が完了するまでシステムはロックされます。',
      'Existing account will be reused': '既存のアカウントが再利用されます',
      'External operations': '外部運用',
      'External operations mode': '外部運用モード',
      'Failed to initialize system': 'システムの初期化に失敗しました',
      'Failed to load setup status': 'セットアップ状態の読み込みに失敗しました',
      'Follow the guided steps to prepare your workspace before the first login.':
        '初回ログイン前に、ガイド付きの手順に従ってワークスペースを準備してください。',
      'How will you use the platform?':
        'プラットフォームをどのように使用しますか？',
      Initialization: '初期化',
      'Initialization failed, please try again.':
        '初期化に失敗しました。もう一度お試しください。',
      Initialize: '初期化',
      'Initialize system': 'システム初期化',
      'Initializing…': '初期化中…',
      'Loading setup status…': 'セットアップステータスをロード中…',
      'MySQL detected': 'MySQLが検出されました',
      'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.':
        'MySQLは本番環境に対応しています。自動バックアップと、最小限必要な権限を持つ専用ユーザーが設定されていることを確認してください。',
      'MySQL is a production-ready relational database. Keep your credentials secure.':
        'MySQL は本番環境対応のリレーショナルデータベースです。認証情報を安全に管理してください。',
      Next: '次へ',
      'Not set yet': '未設定',
      Password: 'パスワード',
      'Password must be at least 8 characters long':
        'パスワードは8文字以上である必要があります',
      'Passwords do not match': 'パスワードが一致しません',
      'Persist your data file': 'データファイルを永続化する',
      'Personal use': '個人利用',
      'Personal use mode': '個人利用モード',
      'Please enter an administrator username': '管理者ユーザー名を入力してください',
      'PostgreSQL detected': 'PostgreSQLが検出されました',
      'PostgreSQL offers advanced reliability and data integrity for production workloads.':
        'PostgreSQL は本番ワークロード向けの高度な信頼性とデータ整合性を提供します。',
      'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.':
        'PostgreSQLは強力な信頼性保証を提供します。本番稼働する前に、メンテナンスウィンドウと保持ポリシーを再確認してください。',
      'Ready to initialize': '初期化準備完了',
      'Repeat the administrator password': '管理者パスワードの再入力',
      'Review & initialize': '確認して初期化',
      'Select a usage mode to continue':
        '続行するには使用モードを選択してください',
      'Serve multiple users or teams with billing and quota control.':
        '課金とクォータ管理で複数のユーザーやチームにサービスを提供します。',
      'Set a secure password (min. 8 characters)':
        '安全なパスワードを設定してください (最低8文字)',
      'Showcase core capabilities with demo credentials and limited access.':
        'デモ用の認証情報と制限付きアクセスでコア機能を紹介します。',
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.':
        'SQLite はすべてのデータを単一ファイルに保存します。コンテナで実行する場合は、ファイルが永続化されていることを確認してください。',
      'System initialized successfully! Redirecting…':
        'システムが正常に初期化されました！リダイレクト中…',
      'System logo': 'システムロゴ',
      'System setup wizard': 'システムセットアップウィザード',
      'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.':
        '管理者アカウントはすでに初期化されています。既存の認証情報を保持して、次のステップに進むことができます。',
      'The setup wizard will use this database during initialization.':
        'セットアップウィザードは初期化時にこのデータベースを使用します。',
      Unknown: '不明',
      'Usage mode': '利用モード',
      'Verify your database connection': 'データベース接続を確認',
      'We could not load the setup status.':
        'セットアップステータスを読み込めませんでした。',
      'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.':
        'コンテナまたは一時的な環境で実行する場合、再起動時のデータ損失を防ぐために、SQLiteファイルが永続ストレージにマッピングされていることを確認してください。',
    },
  },
  ru: {
    translation: {
      'Administrator account': 'Учетная запись администратора',
      'Administrator username': 'Имя пользователя администратора',
      Back: 'Назад',
      'Best for single-tenant deployments. Pricing and billing options stay hidden.':
        'Лучший вариант для однопользовательских развёртываний. Опции ценообразования и биллинга будут скрыты.',
      'Choose a username': 'Выберите имя пользователя',
      'Choose how the platform will operate': 'Выберите режим работы платформы',
      'Complete these steps to finish the initial installation.':
        'Выполните эти шаги, чтобы завершить начальную установку.',
      'Confirm password': 'Подтвердить пароль',
      'Confirm settings and finish setup':
        'Подтвердите настройки и завершите установку',
      'Create credentials for the root user':
        'Создайте учётные данные для администратора',
      'Custom database driver detected.':
        'Обнаружен пользовательский драйвер базы данных.',
      'Data directory:': 'Каталог данных:',
      'Data is stored locally on this device. Use system backups to keep a safe copy.':
        'Данные хранятся локально на этом устройстве. Используйте системные резервные копии для сохранения безопасной копии.',
      Database: 'База данных',
      'Database check': 'Проверка базы данных',
      'Demo site': 'Демо-сайт',
      'Demo site mode': 'Режим демо-сайта',
      'Detected database': 'Обнаруженная база данных',
      'Double check the configuration below. Your system will be locked until initialization is complete.':
        'Дважды проверьте конфигурацию ниже. Ваша система будет заблокирована до завершения инициализации.',
      'Existing account will be reused':
        'Существующая учётная запись будет использована повторно',
      'External operations': 'Внешние операции',
      'External operations mode': 'Режим внешних операций',
      'Failed to initialize system': 'Не удалось инициализировать систему',
      'Failed to load setup status': 'Не удалось загрузить статус настройки',
      'Follow the guided steps to prepare your workspace before the first login.':
        'Следуйте пошаговым инструкциям, чтобы подготовить рабочее пространство перед первым входом.',
      'How will you use the platform?': 'Как вы будете использовать платформу?',
      Initialization: 'Инициализация',
      'Initialization failed, please try again.':
        'Инициализация не удалась, попробуйте ещё раз.',
      Initialize: 'Инициализировать',
      'Initialize system': 'Инициализация системы',
      'Initializing…': 'Инициализация…',
      'Loading setup status…': 'Загрузка статуса установки...',
      'MySQL detected': 'Обнаружен MySQL',
      'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.':
        'MySQL готов к работе. Убедитесь, что настроены автоматические резервные копии и выделенный пользователь с минимально необходимыми привилегиями.',
      'MySQL is a production-ready relational database. Keep your credentials secure.':
        'MySQL — реляционная база данных, готовая к продакшену. Храните учётные данные в безопасности.',
      Next: 'Следующий шаг',
      'Not set yet': 'Ещё не задано',
      Password: 'Пароль',
      'Password must be at least 8 characters long':
        'Пароль должен содержать не менее 8 символов',
      'Passwords do not match': 'Пароли не совпадают',
      'Persist your data file': 'Сохранить ваш файл данных',
      'Personal use': 'Личное использование',
      'Personal use mode': 'Режим личного использования',
      'Please enter an administrator username':
        'Пожалуйста, введите имя пользователя администратора',
      'PostgreSQL detected': 'PostgreSQL обнаружен',
      'PostgreSQL offers advanced reliability and data integrity for production workloads.':
        'PostgreSQL обеспечивает высокую надёжность и целостность данных для продакшен-нагрузок.',
      'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.':
        'PostgreSQL предлагает надежные гарантии. Дважды проверьте окно обслуживания и политики хранения данных перед запуском.',
      'Ready to initialize': 'Готов к инициализации',
      'Repeat the administrator password': 'Повторите пароль администратора',
      'Review & initialize': 'Проверить и инициализировать',
      'Select a usage mode to continue':
        'Выберите режим использования для продолжения',
      'Serve multiple users or teams with billing and quota control.':
        'Обслуживание нескольких пользователей или команд с управлением биллингом и квотами.',
      'Set a secure password (min. 8 characters)':
        'Установите надежный пароль (минимум 8 символов)',
      'Showcase core capabilities with demo credentials and limited access.':
        'Демонстрация основных возможностей с демо-учётными данными и ограниченным доступом.',
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.':
        'SQLite хранит все данные в одном файле. Убедитесь, что файл сохраняется при работе в контейнерах.',
      'System initialized successfully! Redirecting…':
        'Система успешно инициализирована! Перенаправление…',
      'System logo': 'Логотип системы',
      'System setup wizard': 'Мастер настройки системы',
      'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.':
        'Учетная запись администратора уже инициализирована. Вы можете сохранить существующие учетные данные и перейти к следующему шагу.',
      'The setup wizard will use this database during initialization.':
        'Мастер настройки будет использовать эту базу данных при инициализации.',
      Unknown: 'Неизвестно',
      'Usage mode': 'Режим использования',
      'Verify your database connection': 'Проверьте подключение к базе данных',
      'We could not load the setup status.':
        'Не удалось загрузить статус настройки.',
      'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.':
        'При работе в контейнерах или эфемерных средах убедитесь, что файл SQLite сопоставлен с постоянным хранилищем, чтобы избежать потери данных при перезапуске.',
    },
  },
  vi: {
    translation: {
      'Administrator account': 'Tài khoản quản trị viên',
      'Administrator username': 'Tên người dùng quản trị viên',
      Back: 'Quay lại',
      'Best for single-tenant deployments. Pricing and billing options stay hidden.':
        'Phù hợp nhất cho triển khai đơn người dùng. Các tùy chọn giá và thanh toán sẽ được ẩn.',
      'Choose a username': 'Chọn tên người dùng',
      'Choose how the platform will operate':
        'Chọn cách nền tảng sẽ hoạt động',
      'Complete these steps to finish the initial installation.':
        'Hoàn thành các bước này để hoàn tất quá trình cài đặt ban đầu.',
      'Confirm password': 'Xác nhận mật khẩu',
      'Confirm settings and finish setup':
        'Xác nhận cài đặt và hoàn tất thiết lập',
      'Create credentials for the root user':
        'Tạo thông tin đăng nhập cho tài khoản quản trị',
      'Custom database driver detected.':
        'Đã phát hiện trình điều khiển cơ sở dữ liệu tùy chỉnh.',
      'Data directory:': 'Thư mục dữ liệu:',
      'Data is stored locally on this device. Use system backups to keep a safe copy.':
        'Dữ liệu được lưu trữ cục bộ trên thiết bị này. Sử dụng tính năng sao lưu hệ thống để giữ một bản sao an toàn.',
      Database: 'Cơ sở dữ liệu',
      'Database check': 'Kiểm tra cơ sở dữ liệu',
      'Demo site': 'Trang demo',
      'Demo site mode': 'Chế độ trang demo',
      'Detected database': 'Đã phát hiện cơ sở dữ liệu',
      'Double check the configuration below. Your system will be locked until initialization is complete.':
        'Kiểm tra kỹ lại cấu hình bên dưới. Hệ thống của bạn sẽ bị khóa cho đến khi quá trình khởi tạo hoàn tất.',
      'Existing account will be reused': 'Tài khoản hiện có sẽ được sử dụng lại',
      'External operations': 'Vận hành bên ngoài',
      'External operations mode': 'Chế độ vận hành bên ngoài',
      'Failed to initialize system': 'Không thể khởi tạo hệ thống',
      'Failed to load setup status': 'Không thể tải trạng thái thiết lập',
      'Follow the guided steps to prepare your workspace before the first login.':
        'Thực hiện theo các bước hướng dẫn để chuẩn bị không gian làm việc của bạn trước lần đăng nhập đầu tiên.',
      'How will you use the platform?': 'Bạn sẽ sử dụng nền tảng như thế nào?',
      Initialization: 'Khởi tạo',
      'Initialization failed, please try again.':
        'Khởi tạo thất bại, vui lòng thử lại.',
      Initialize: 'Khởi tạo',
      'Initialize system': 'Khởi tạo hệ thống',
      'Initializing…': 'Đang khởi tạo…',
      'Loading setup status…': 'Đang tải trạng thái cài đặt…',
      'MySQL detected': 'Đã phát hiện MySQL',
      'MySQL is production ready. Ensure automated backups and a dedicated user with the minimal required privileges are configured.':
        'MySQL đã sẵn sàng để triển khai sản xuất. Đảm bảo sao lưu tự động và một người dùng chuyên dụng với các đặc quyền tối thiểu cần thiết được cấu hình.',
      'MySQL is a production-ready relational database. Keep your credentials secure.':
        'MySQL là cơ sở dữ liệu quan hệ sẵn sàng cho production. Hãy giữ thông tin đăng nhập an toàn.',
      Next: 'Tiếp',
      'Not set yet': 'Chưa thiết lập',
      Password: 'Mật khẩu',
      'Password must be at least 8 characters long':
        'Mật khẩu phải có ít nhất 8 ký tự',
      'Passwords do not match': 'Mật khẩu không khớp',
      'Persist your data file': 'Lưu trữ tệp dữ liệu của bạn',
      'Personal use': 'Sử dụng cá nhân',
      'Personal use mode': 'Chế độ sử dụng cá nhân',
      'Please enter an administrator username':
        'Vui lòng nhập tên người dùng quản trị viên',
      'PostgreSQL detected': 'Phát hiện PostgreSQL',
      'PostgreSQL offers advanced reliability and data integrity for production workloads.':
        'PostgreSQL cung cấp độ tin cậy cao và tính toàn vẹn dữ liệu cho khối lượng công việc production.',
      'PostgreSQL offers strong reliability guarantees. Double check your maintenance window and retention policies before going live.':
        'PostgreSQL cung cấp các đảm bảo độ tin cậy cao. Hãy kiểm tra kỹ lưỡng cửa sổ bảo trì và các chính sách lưu giữ của bạn trước khi vận hành chính thức.',
      'Ready to initialize': 'Sẵn sàng khởi tạo',
      'Repeat the administrator password': 'Nhập lại mật khẩu quản trị viên',
      'Review & initialize': 'Xem lại và khởi tạo',
      'Select a usage mode to continue': 'Chọn chế độ sử dụng để tiếp tục',
      'Serve multiple users or teams with billing and quota control.':
        'Phục vụ nhiều người dùng hoặc nhóm với quản lý thanh toán và hạn mức.',
      'Set a secure password (min. 8 characters)':
        'Đặt mật khẩu an toàn (tối thiểu 8 ký tự)',
      'Showcase core capabilities with demo credentials and limited access.':
        'Trình diễn các tính năng cốt lõi với thông tin đăng nhập demo và quyền truy cập hạn chế.',
      'SQLite stores all data in a single file. Make sure that file is persisted when running in containers.':
        'SQLite lưu trữ tất cả dữ liệu trong một tệp duy nhất. Đảm bảo tệp được lưu trữ lâu dài khi chạy trong container.',
      'System initialized successfully! Redirecting…':
        'Hệ thống đã được khởi tạo thành công! Đang chuyển hướng…',
      'System logo': 'Logo hệ thống',
      'System setup wizard': 'Trình hướng dẫn thiết lập hệ thống',
      'The administrator account is already initialized. You can keep your existing credentials and continue to the next step.':
        'Tài khoản quản trị viên đã được khởi tạo. Bạn có thể giữ nguyên thông tin đăng nhập hiện có của mình và tiếp tục sang bước tiếp theo.',
      'The setup wizard will use this database during initialization.':
        'Trình hướng dẫn thiết lập sẽ sử dụng cơ sở dữ liệu này trong quá trình khởi tạo.',
      Unknown: 'Không xác định',
      'Usage mode': 'Chế độ sử dụng',
      'Verify your database connection':
        'Xác minh kết nối cơ sở dữ liệu của bạn',
      'We could not load the setup status.':
        'Chúng tôi không thể tải trạng thái thiết lập.',
      'When running in containers or ephemeral environments, ensure the SQLite file is mapped to persistent storage to avoid data loss on restart.':
        'Khi chạy trong container hoặc môi trường tạm thời, hãy đảm bảo tệp SQLite được ánh xạ vào bộ nhớ lưu trữ bền vững để tránh mất dữ liệu khi khởi động lại.',
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
