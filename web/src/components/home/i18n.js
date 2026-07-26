/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import i18n from '../../i18n/i18n';

const vibeCodingHomeResources = {
  en: {
    'AI-Powered Development': 'AI-Powered Development',
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      'Choose a plan for your usage scenario, with benefits and pricing clear at a glance',
    'AI 编程助手全家桶': 'Complete AI Coding Assistant Suite',
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      'Three powerful AI coding tools covering terminal, IDE, and cloud scenarios to boost your development efficiency.',
    '终端集成 · 结对编程 · 深度理解':
      'Terminal integration · pair programming · deep understanding',
    'Claude Opus 4.6 驱动': 'Powered by Claude Opus 4.6',
    深度理解代码上下文: 'Deep code context understanding',
    智能调试与文档生成: 'Intelligent debugging and documentation generation',
    '全平台 CLI 支持': 'Cross-platform CLI support',
    '企业级 · 智能重构 · 实时联网':
      'Enterprise-grade · intelligent refactoring · real-time web access',
    'GPT 5.4驱动': 'Powered by GPT 5.4',
    实时联网能力: 'Real-time web access',
    智能代码重构: 'Intelligent code refactoring',
    'VSCode 深度集成': 'Deep VSCode integration',
    '超大上下文 · Agent模式 · 多模态': 'Long context · Agent Mode · multimodal',
    '1M tokens 超大上下文': '1M-token long context',
    'Agent Mode 自动规划': 'Agent Mode planning',
    '内置 Google Search': 'Built-in Google Search',
    多模态输入支持: 'Multimodal input support',
    核心优势: 'Core Advantages',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      'We provide enterprise-grade performance guarantees for your AI applications, ensuring every call is stable and efficient.',
    极速响应: 'Ultra-fast Response',
    毫秒级API响应时间: 'Millisecond-level API response time',
    千万级并发处理能力: '10M+ concurrency capacity',
    智能负载均衡系统: 'Intelligent load balancing system',
    超两年稳定运行验证: 'Proven stable operation for over two years',
    全球网络: 'Global Network',
    全球多区域节点部署: 'Multi-region global node deployment',
    'CN2 GIA专线接入': 'CN2 GIA dedicated line access',
    '全球70+高速中转节点': '70+ high-speed global relay nodes',
    智能路由优化: 'Intelligent route optimization',
    透明计费: 'Transparent Billing',
    官方标准计费模式: 'Official standard billing model',
    无任何隐藏费用: 'No hidden fees',
    按需使用成本可控: 'Pay as needed with predictable costs',
    账户余额永不过期: 'Account balance never expires',
    全面兼容: 'Broad Compatibility',
    '完美兼容OpenAI, Claude, Gemini':
      'Fully compatible with OpenAI, Claude, and Gemini',
    支持全球所有主流大语言模型: 'Supports all major global LLMs',
    轻松集成现有应用工作流:
      'Easily integrates with existing application workflows',
    模型库与功能持续更新: 'Model library and features continuously updated',
    服务保障: 'Service Assurance',
    '7x24小时在线服务': '24/7 online service',
    便捷的在线自助充值: 'Convenient online self-service top-up',
    详尽的消费日志查询: 'Detailed usage log queries',
    专业工程师技术支持: 'Technical support from professional engineers',
    Midjourney支持: 'Midjourney Support',
    内置提示词中文优化: 'Built-in Chinese prompt optimization',
    高速稳定的反向代理: 'Fast, stable reverse proxy',
    同步支持最新版本: 'Timely support for the latest version',
    高并发任务处理: 'High-concurrency task processing',
  },
  'zh-CN': {
    'AI-Powered Development': 'AI 驱动开发',
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      '按你的使用场景选择套餐，权益与价格一目了然',
    'AI 编程助手全家桶': 'AI 编程助手全家桶',
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率',
    '终端集成 · 结对编程 · 深度理解': '终端集成 · 结对编程 · 深度理解',
    'Claude Opus 4.6 驱动': 'Claude Opus 4.6 驱动',
    深度理解代码上下文: '深度理解代码上下文',
    智能调试与文档生成: '智能调试与文档生成',
    '全平台 CLI 支持': '全平台 CLI 支持',
    '企业级 · 智能重构 · 实时联网': '企业级 · 智能重构 · 实时联网',
    'GPT 5.4驱动': 'GPT 5.4 驱动',
    实时联网能力: '实时联网能力',
    智能代码重构: '智能代码重构',
    'VSCode 深度集成': 'VSCode 深度集成',
    '超大上下文 · Agent模式 · 多模态': '超大上下文 · Agent 模式 · 多模态',
    '1M tokens 超大上下文': '1M tokens 超大上下文',
    'Agent Mode 自动规划': 'Agent Mode 自动规划',
    '内置 Google Search': '内置 Google Search',
    多模态输入支持: '多模态输入支持',
    核心优势: '核心优势',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      '我们为您的 AI 应用提供企业级性能保障，确保每一次调用都稳定高效',
    极速响应: '极速响应',
    毫秒级API响应时间: '毫秒级 API 响应时间',
    千万级并发处理能力: '千万级并发处理能力',
    智能负载均衡系统: '智能负载均衡系统',
    超两年稳定运行验证: '超两年稳定运行验证',
    全球网络: '全球网络',
    全球多区域节点部署: '全球多区域节点部署',
    'CN2 GIA专线接入': 'CN2 GIA 专线接入',
    '全球70+高速中转节点': '全球 70+ 高速中转节点',
    智能路由优化: '智能路由优化',
    透明计费: '透明计费',
    官方标准计费模式: '官方标准计费模式',
    无任何隐藏费用: '无任何隐藏费用',
    按需使用成本可控: '按需使用，成本可控',
    账户余额永不过期: '账户余额永不过期',
    全面兼容: '全面兼容',
    '完美兼容OpenAI, Claude, Gemini': '完美兼容 OpenAI、Claude、Gemini',
    支持全球所有主流大语言模型: '支持全球所有主流大语言模型',
    轻松集成现有应用工作流: '轻松集成现有应用工作流',
    模型库与功能持续更新: '模型库与功能持续更新',
    服务保障: '服务保障',
    '7x24小时在线服务': '7x24 小时在线服务',
    便捷的在线自助充值: '便捷的在线自助充值',
    详尽的消费日志查询: '详尽的消费日志查询',
    专业工程师技术支持: '专业工程师技术支持',
    Midjourney支持: 'Midjourney 支持',
    内置提示词中文优化: '内置提示词中文优化',
    高速稳定的反向代理: '高速稳定的反向代理',
    同步支持最新版本: '同步支持最新版本',
    高并发任务处理: '高并发任务处理',
  },
  'zh-TW': {
    'AI-Powered Development': 'AI 驅動開發',
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      '依你的使用場景選擇方案，權益與價格一目了然',
    'AI 编程助手全家桶': 'AI 程式開發助手全套方案',
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      '三款強大的 AI 編程工具，覆蓋終端、IDE、雲端全場景，全面提升您的開發效率',
    '终端集成 · 结对编程 · 深度理解': '終端整合 · 結對編程 · 深度理解',
    'Claude Opus 4.6 驱动': 'Claude Opus 4.6 驅動',
    深度理解代码上下文: '深度理解程式碼上下文',
    智能调试与文档生成: '智慧除錯與文件生成',
    '全平台 CLI 支持': '全平台 CLI 支援',
    '企业级 · 智能重构 · 实时联网': '企業級 · 智慧重構 · 即時連網',
    'GPT 5.4驱动': 'GPT 5.4 驅動',
    实时联网能力: '即時連網能力',
    智能代码重构: '智慧程式碼重構',
    'VSCode 深度集成': 'VSCode 深度整合',
    '超大上下文 · Agent模式 · 多模态': '超大上下文 · Agent 模式 · 多模態',
    '1M tokens 超大上下文': '1M tokens 超大上下文',
    'Agent Mode 自动规划': 'Agent Mode 自動規劃',
    '内置 Google Search': '內建 Google Search',
    多模态输入支持: '多模態輸入支援',
    核心优势: '核心優勢',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      '我們為您的 AI 應用提供企業級性能保障，確保每一次呼叫都穩定高效',
    极速响应: '極速回應',
    毫秒级API响应时间: '毫秒級 API 回應時間',
    千万级并发处理能力: '千萬級併發處理能力',
    智能负载均衡系统: '智慧負載均衡系統',
    超两年稳定运行验证: '超過兩年穩定運行驗證',
    全球网络: '全球網路',
    全球多区域节点部署: '全球多區域節點部署',
    'CN2 GIA专线接入': 'CN2 GIA 專線接入',
    '全球70+高速中转节点': '全球 70+ 高速中轉節點',
    智能路由优化: '智慧路由最佳化',
    透明计费: '透明計費',
    官方标准计费模式: '官方標準計費模式',
    无任何隐藏费用: '無任何隱藏費用',
    按需使用成本可控: '按需使用，成本可控',
    账户余额永不过期: '帳戶餘額永不過期',
    全面兼容: '全面相容',
    '完美兼容OpenAI, Claude, Gemini': '完美相容 OpenAI、Claude、Gemini',
    支持全球所有主流大语言模型: '支援全球所有主流大型語言模型',
    轻松集成现有应用工作流: '輕鬆整合現有應用工作流程',
    模型库与功能持续更新: '模型庫與功能持續更新',
    服务保障: '服務保障',
    '7x24小时在线服务': '7x24 小時線上服務',
    便捷的在线自助充值: '便捷的線上自助儲值',
    详尽的消费日志查询: '詳盡的消費記錄查詢',
    专业工程师技术支持: '專業工程師技術支援',
    Midjourney支持: 'Midjourney 支援',
    内置提示词中文优化: '內建提示詞中文最佳化',
    高速稳定的反向代理: '高速穩定的反向代理',
    同步支持最新版本: '同步支援最新版本',
    高并发任务处理: '高併發任務處理',
  },
  fr: {
    'AI-Powered Development': "Développement propulsé par l'IA",
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      'Choisissez une offre selon votre usage, avec des avantages et des prix clairs en un coup d’oeil',
    'AI 编程助手全家桶': "Suite complète d'assistants de codage IA",
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      "Trois puissants outils de codage IA couvrant le terminal, l'IDE et le cloud pour améliorer fortement votre efficacité de développement.",
    '终端集成 · 结对编程 · 深度理解':
      'Intégration terminal · programmation en binôme · compréhension approfondie',
    'Claude Opus 4.6 驱动': 'Propulsé par Claude Opus 4.6',
    深度理解代码上下文: 'Compréhension approfondie du contexte du code',
    智能调试与文档生成: 'Débogage intelligent et génération de documentation',
    '全平台 CLI 支持': 'Prise en charge CLI multiplateforme',
    '企业级 · 智能重构 · 实时联网':
      'Niveau entreprise · refactorisation intelligente · accès web en temps réel',
    'GPT 5.4驱动': 'Propulsé par GPT 5.4',
    实时联网能力: 'Accès web en temps réel',
    智能代码重构: 'Refactorisation intelligente du code',
    'VSCode 深度集成': 'Intégration avancée avec VSCode',
    '超大上下文 · Agent模式 · 多模态':
      'Contexte très étendu · mode Agent · multimodalité',
    '1M tokens 超大上下文': 'Contexte très étendu de 1M tokens',
    'Agent Mode 自动规划': 'Planification automatique en Agent Mode',
    '内置 Google Search': 'Recherche Google intégrée',
    多模态输入支持: 'Prise en charge des entrées multimodales',
    核心优势: 'Avantages clés',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      'Nous offrons des garanties de performance de niveau entreprise pour vos applications IA, afin que chaque appel soit stable et efficace.',
    极速响应: 'Réponse ultrarapide',
    毫秒级API响应时间: 'Temps de réponse API en millisecondes',
    千万级并发处理能力: 'Capacité de traitement de très forte concurrence',
    智能负载均衡系统: "Système intelligent d'équilibrage de charge",
    超两年稳定运行验证: 'Stabilité éprouvée pendant plus de deux ans',
    全球网络: 'Réseau mondial',
    全球多区域节点部署: 'Déploiement de nœuds multirégion dans le monde',
    'CN2 GIA专线接入': 'Accès par ligne dédiée CN2 GIA',
    '全球70+高速中转节点': 'Plus de 70 nœuds relais mondiaux haut débit',
    智能路由优化: 'Optimisation intelligente du routage',
    透明计费: 'Facturation transparente',
    官方标准计费模式: 'Modèle de facturation standard officiel',
    无任何隐藏费用: 'Aucuns frais cachés',
    按需使用成本可控: "Coûts maîtrisés à l'usage",
    账户余额永不过期: "Le solde du compte n'expire jamais",
    全面兼容: 'Compatibilité complète',
    '完美兼容OpenAI, Claude, Gemini':
      'Parfaitement compatible avec OpenAI, Claude et Gemini',
    支持全球所有主流大语言模型:
      'Prend en charge tous les principaux grands modèles de langage mondiaux',
    轻松集成现有应用工作流:
      "S'intègre facilement aux workflows d'applications existants",
    模型库与功能持续更新:
      'Bibliothèque de modèles et fonctionnalités mises à jour en continu',
    服务保障: 'Garantie de service',
    '7x24小时在线服务': 'Service en ligne 24 h/24, 7 j/7',
    便捷的在线自助充值: 'Recharge en ligne self-service pratique',
    详尽的消费日志查询: 'Consultation détaillée des journaux de consommation',
    专业工程师技术支持: 'Support technique assuré par des ingénieurs experts',
    Midjourney支持: 'Prise en charge de Midjourney',
    内置提示词中文优化: 'Optimisation intégrée des prompts en chinois',
    高速稳定的反向代理: 'Proxy inverse rapide et stable',
    同步支持最新版本: 'Prise en charge synchronisée de la dernière version',
    高并发任务处理: 'Traitement des tâches à forte concurrence',
  },
  ru: {
    'AI-Powered Development': 'Разработка на базе ИИ',
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      'Выберите план под свой сценарий использования, с понятными преимуществами и ценами',
    'AI 编程助手全家桶': 'Полный набор ИИ-ассистентов для программирования',
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      'Три мощных инструмента для программирования с ИИ охватывают терминал, IDE и облако, заметно повышая эффективность разработки.',
    '终端集成 · 结对编程 · 深度理解':
      'Интеграция с терминалом · парное программирование · глубокое понимание',
    'Claude Opus 4.6 驱动': 'На базе Claude Opus 4.6',
    深度理解代码上下文: 'Глубокое понимание контекста кода',
    智能调试与文档生成: 'Интеллектуальная отладка и генерация документации',
    '全平台 CLI 支持': 'Поддержка CLI на всех платформах',
    '企业级 · 智能重构 · 实时联网':
      'Корпоративный уровень · интеллектуальный рефакторинг · доступ к сети в реальном времени',
    'GPT 5.4驱动': 'На базе GPT 5.4',
    实时联网能力: 'Доступ к сети в реальном времени',
    智能代码重构: 'Интеллектуальный рефакторинг кода',
    'VSCode 深度集成': 'Глубокая интеграция с VSCode',
    '超大上下文 · Agent模式 · 多模态':
      'Очень большой контекст · режим Agent · мультимодальность',
    '1M tokens 超大上下文': 'Очень большой контекст в 1 млн токенов',
    'Agent Mode 自动规划': 'Автоматическое планирование в Agent Mode',
    '内置 Google Search': 'Встроенный Google Search',
    多模态输入支持: 'Поддержка мультимодального ввода',
    核心优势: 'Ключевые преимущества',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      'Мы обеспечиваем корпоративный уровень производительности для ваших AI-приложений, чтобы каждый вызов был стабильным и эффективным.',
    极速响应: 'Сверхбыстрый отклик',
    毫秒级API响应时间: 'Время ответа API на уровне миллисекунд',
    千万级并发处理能力: 'Обработка десятков миллионов конкурентных запросов',
    智能负载均衡系统: 'Интеллектуальная система балансировки нагрузки',
    超两年稳定运行验证: 'Проверенная стабильная работа более двух лет',
    全球网络: 'Глобальная сеть',
    全球多区域节点部署:
      'Развертывание узлов в нескольких регионах по всему миру',
    'CN2 GIA专线接入': 'Доступ через выделенную линию CN2 GIA',
    '全球70+高速中转节点': '70+ высокоскоростных глобальных транзитных узлов',
    智能路由优化: 'Интеллектуальная оптимизация маршрутов',
    透明计费: 'Прозрачная тарификация',
    官方标准计费模式: 'Официальная стандартная модель тарификации',
    无任何隐藏费用: 'Без скрытых платежей',
    按需使用成本可控:
      'Контролируемые расходы при оплате по факту использования',
    账户余额永不过期: 'Баланс аккаунта никогда не истекает',
    全面兼容: 'Полная совместимость',
    '完美兼容OpenAI, Claude, Gemini':
      'Полная совместимость с OpenAI, Claude и Gemini',
    支持全球所有主流大语言模型:
      'Поддержка всех основных мировых больших языковых моделей',
    轻松集成现有应用工作流:
      'Легкая интеграция в существующие рабочие процессы приложений',
    模型库与功能持续更新: 'Библиотека моделей и функции постоянно обновляются',
    服务保障: 'Гарантия обслуживания',
    '7x24小时在线服务': 'Онлайн-сервис 24/7',
    便捷的在线自助充值: 'Удобное самостоятельное пополнение онлайн',
    详尽的消费日志查询: 'Подробный просмотр журналов расходов',
    专业工程师技术支持: 'Техническая поддержка профессиональных инженеров',
    Midjourney支持: 'Поддержка Midjourney',
    内置提示词中文优化: 'Встроенная оптимизация подсказок на китайском',
    高速稳定的反向代理: 'Быстрый и стабильный обратный прокси',
    同步支持最新版本: 'Синхронная поддержка последних версий',
    高并发任务处理: 'Обработка задач с высокой конкурентностью',
  },
  ja: {
    'AI-Powered Development': 'AI 駆動の開発',
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      '利用シーンに合わせてプランを選択し、特典と価格をひと目で確認',
    'AI 编程助手全家桶': 'AI コーディングアシスタント一式',
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      '3つの強力な AI コーディングツールが、ターミナル、IDE、クラウドの全シーンをカバーし、開発効率を全面的に高めます。',
    '终端集成 · 结对编程 · 深度理解':
      'ターミナル連携 · ペアプログラミング · 深い理解',
    'Claude Opus 4.6 驱动': 'Claude Opus 4.6 搭載',
    深度理解代码上下文: 'コードコンテキストを深く理解',
    智能调试与文档生成: 'スマートデバッグとドキュメント生成',
    '全平台 CLI 支持': '全プラットフォーム CLI 対応',
    '企业级 · 智能重构 · 实时联网':
      'エンタープライズ級 · スマートリファクタリング · リアルタイム接続',
    'GPT 5.4驱动': 'GPT 5.4 搭載',
    实时联网能力: 'リアルタイム接続機能',
    智能代码重构: 'スマートコードリファクタリング',
    'VSCode 深度集成': 'VSCode 深度連携',
    '超大上下文 · Agent模式 · 多模态':
      '超大規模コンテキスト · Agent モード · マルチモーダル',
    '1M tokens 超大上下文': '1M tokens の超大規模コンテキスト',
    'Agent Mode 自动规划': 'Agent Mode による自動計画',
    '内置 Google Search': 'Google Search 内蔵',
    多模态输入支持: 'マルチモーダル入力対応',
    核心优势: '主な強み',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      'AI アプリケーションにエンタープライズ級の性能保証を提供し、すべての呼び出しを安定かつ高効率にします。',
    极速响应: '超高速レスポンス',
    毫秒级API响应时间: 'ミリ秒レベルの API 応答時間',
    千万级并发处理能力: '千万級の同時処理能力',
    智能负载均衡系统: 'スマートロードバランシングシステム',
    超两年稳定运行验证: '2年以上の安定稼働で実証済み',
    全球网络: 'グローバルネットワーク',
    全球多区域节点部署: '世界複数リージョンへのノード配置',
    'CN2 GIA专线接入': 'CN2 GIA 専用線アクセス',
    '全球70+高速中转节点': '世界 70+ の高速中継ノード',
    智能路由优化: 'スマートルーティング最適化',
    透明计费: '透明な課金',
    官方标准计费模式: '公式標準の課金モデル',
    无任何隐藏费用: '隠れた費用なし',
    按需使用成本可控: '従量利用でコスト管理可能',
    账户余额永不过期: 'アカウント残高は無期限',
    全面兼容: '幅広い互換性',
    '完美兼容OpenAI, Claude, Gemini': 'OpenAI、Claude、Gemini に完全対応',
    支持全球所有主流大语言模型: '世界の主要な大規模言語モデルをすべてサポート',
    轻松集成现有应用工作流: '既存アプリケーションのワークフローに簡単統合',
    模型库与功能持续更新: 'モデルライブラリと機能を継続更新',
    服务保障: 'サービス保証',
    '7x24小时在线服务': '24時間365日のオンラインサービス',
    便捷的在线自助充值: '便利なオンラインセルフチャージ',
    详尽的消费日志查询: '詳細な利用ログ検索',
    专业工程师技术支持: '専門エンジニアによる技術サポート',
    Midjourney支持: 'Midjourney 対応',
    内置提示词中文优化: '中国語プロンプト最適化を内蔵',
    高速稳定的反向代理: '高速で安定したリバースプロキシ',
    同步支持最新版本: '最新バージョンを同期サポート',
    高并发任务处理: '高同時実行タスク処理',
  },
  vi: {
    'AI-Powered Development': 'Phát triển được hỗ trợ bởi AI',
    'Vibe Coding': 'Vibe Coding',
    '按你的使用场景选择套餐，权益与价格一目了然':
      'Chọn gói theo nhu cầu sử dụng, quyền lợi và giá hiển thị rõ ràng',
    'AI 编程助手全家桶': 'Bộ trợ lý lập trình AI đầy đủ',
    '三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率':
      'Ba công cụ lập trình AI mạnh mẽ bao phủ terminal, IDE và đám mây, giúp nâng cao toàn diện hiệu suất phát triển của bạn.',
    '终端集成 · 结对编程 · 深度理解':
      'Tích hợp terminal · lập trình cặp · hiểu sâu',
    'Claude Opus 4.6 驱动': 'Được hỗ trợ bởi Claude Opus 4.6',
    深度理解代码上下文: 'Hiểu sâu ngữ cảnh mã nguồn',
    智能调试与文档生成: 'Gỡ lỗi thông minh và tạo tài liệu',
    '全平台 CLI 支持': 'Hỗ trợ CLI đa nền tảng',
    '企业级 · 智能重构 · 实时联网':
      'Cấp doanh nghiệp · tái cấu trúc thông minh · kết nối mạng thời gian thực',
    'GPT 5.4驱动': 'Được hỗ trợ bởi GPT 5.4',
    实时联网能力: 'Khả năng kết nối mạng thời gian thực',
    智能代码重构: 'Tái cấu trúc mã thông minh',
    'VSCode 深度集成': 'Tích hợp sâu với VSCode',
    '超大上下文 · Agent模式 · 多模态':
      'Ngữ cảnh siêu lớn · chế độ Agent · đa phương thức',
    '1M tokens 超大上下文': 'Ngữ cảnh siêu lớn 1M tokens',
    'Agent Mode 自动规划': 'Agent Mode tự động lập kế hoạch',
    '内置 Google Search': 'Tích hợp Google Search',
    多模态输入支持: 'Hỗ trợ đầu vào đa phương thức',
    核心优势: 'Lợi thế cốt lõi',
    '我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效':
      'Chúng tôi cung cấp bảo đảm hiệu năng cấp doanh nghiệp cho ứng dụng AI của bạn, đảm bảo mỗi lần gọi đều ổn định và hiệu quả.',
    极速响应: 'Phản hồi cực nhanh',
    毫秒级API响应时间: 'Thời gian phản hồi API ở mức mili giây',
    千万级并发处理能力: 'Khả năng xử lý đồng thời cấp hàng chục triệu',
    智能负载均衡系统: 'Hệ thống cân bằng tải thông minh',
    超两年稳定运行验证: 'Đã được kiểm chứng vận hành ổn định hơn hai năm',
    全球网络: 'Mạng toàn cầu',
    全球多区域节点部署: 'Triển khai nút đa khu vực toàn cầu',
    'CN2 GIA专线接入': 'Truy cập đường truyền riêng CN2 GIA',
    '全球70+高速中转节点': '70+ nút trung chuyển tốc độ cao trên toàn cầu',
    智能路由优化: 'Tối ưu định tuyến thông minh',
    透明计费: 'Thanh toán minh bạch',
    官方标准计费模式: 'Mô hình tính phí tiêu chuẩn chính thức',
    无任何隐藏费用: 'Không có phí ẩn',
    按需使用成本可控: 'Dùng theo nhu cầu, kiểm soát chi phí',
    账户余额永不过期: 'Số dư tài khoản không bao giờ hết hạn',
    全面兼容: 'Tương thích toàn diện',
    '完美兼容OpenAI, Claude, Gemini':
      'Tương thích hoàn hảo với OpenAI, Claude, Gemini',
    支持全球所有主流大语言模型:
      'Hỗ trợ tất cả các mô hình ngôn ngữ lớn chủ đạo trên toàn cầu',
    轻松集成现有应用工作流: 'Dễ dàng tích hợp vào quy trình ứng dụng hiện có',
    模型库与功能持续更新:
      'Thư viện mô hình và tính năng được cập nhật liên tục',
    服务保障: 'Bảo đảm dịch vụ',
    '7x24小时在线服务': 'Dịch vụ trực tuyến 24/7',
    便捷的在线自助充值: 'Nạp tiền trực tuyến tự phục vụ tiện lợi',
    详尽的消费日志查询: 'Tra cứu nhật ký tiêu dùng chi tiết',
    专业工程师技术支持: 'Hỗ trợ kỹ thuật từ kỹ sư chuyên nghiệp',
    Midjourney支持: 'Hỗ trợ Midjourney',
    内置提示词中文优化: 'Tích hợp tối ưu hóa prompt tiếng Trung',
    高速稳定的反向代理: 'Proxy ngược nhanh và ổn định',
    同步支持最新版本: 'Hỗ trợ đồng bộ phiên bản mới nhất',
    高并发任务处理: 'Xử lý tác vụ đồng thời cao',
  },
};

const resources = {
  en: {
    translation: {
      ...vibeCodingHomeResources.en,
      'AI Application Infrastructure Foundation':
        'AI Application Infrastructure Foundation',
      'Unified API Gateway for': 'Unified API Gateway for',
      'Vast Range of AI Models': 'Vast Range of AI Models',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.',
      'Go to Dashboard': 'Go to Dashboard',
      Docs: 'Docs',
      'Get Started': 'Get Started',
      'View Pricing': 'View Pricing',
      'Supported Applications': 'Supported Applications',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.',
      'More Apps': 'More Apps',
      支持众多的大模型供应商: 'Supporting various LLM providers',
    },
  },
  'zh-CN': {
    translation: {
      ...vibeCodingHomeResources['zh-CN'],
      'AI Application Infrastructure Foundation': 'AI 应用基础设施底座',
      'Unified API Gateway for': '统一 API 网关，接入',
      'Vast Range of AI Models': '海量 AI 模型',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        '通过标准统一的 API 协议接入海量模型，驱动 AI 应用、管理数字资产，并连接未来。',
      'Go to Dashboard': '前往控制台',
      Docs: '文档',
      'Get Started': '开始使用',
      'View Pricing': '查看价格',
      'Supported Applications': '支持的应用',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        '支持一键配置，完美适配 NewAPI 多协议配置。',
      'More Apps': '更多应用',
      支持众多的大模型供应商: '支持众多的大模型供应商',
    },
  },
  'zh-TW': {
    translation: {
      ...vibeCodingHomeResources['zh-TW'],
      'AI Application Infrastructure Foundation': 'AI 應用基礎設施底座',
      'Unified API Gateway for': '統一 API 閘道，接入',
      'Vast Range of AI Models': '海量 AI 模型',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        '透過標準統一的 API 協議接入海量模型，驅動 AI 應用、管理數位資產，並連接未來。',
      'Go to Dashboard': '前往控制台',
      Docs: '文件',
      'Get Started': '開始使用',
      'View Pricing': '查看價格',
      'Supported Applications': '支援的應用',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        '支援一鍵配置，完美適配 NewAPI 多協議配置。',
      'More Apps': '更多應用',
      支持众多的大模型供应商: '支援眾多的大模型供應商',
    },
  },
  fr: {
    translation: {
      ...vibeCodingHomeResources.fr,
      'AI Application Infrastructure Foundation':
        "Socle d'infrastructure pour applications IA",
      'Unified API Gateway for': 'Passerelle API unifiée pour',
      'Vast Range of AI Models': 'un vaste choix de modèles IA',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        "Accédez à un vaste choix de modèles via un protocole API standard et unifié. Alimentez vos applications IA, gérez vos actifs numériques et connectez l'avenir.",
      'Go to Dashboard': 'Accéder au tableau de bord',
      Docs: 'Docs',
      'Get Started': 'Commencer',
      'View Pricing': 'Voir les tarifs',
      'Supported Applications': 'Applications prises en charge',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        "Prend en charge la configuration en un clic et s'adapte parfaitement à la configuration multiprotocole NewAPI.",
      'More Apps': "Plus d'applications",
      支持众多的大模型供应商: 'Prise en charge de divers fournisseurs de LLM',
    },
  },
  ru: {
    translation: {
      ...vibeCodingHomeResources.ru,
      'AI Application Infrastructure Foundation':
        'Основа инфраструктуры для AI-приложений',
      'Unified API Gateway for': 'Единый API-шлюз для',
      'Vast Range of AI Models': 'широкого набора AI-моделей',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        'Получайте доступ к широкому набору моделей через стандартный единый API-протокол. Запускайте AI-приложения, управляйте цифровыми активами и подключайтесь к будущему.',
      'Go to Dashboard': 'Перейти в панель управления',
      Docs: 'Документация',
      'Get Started': 'Начать',
      'View Pricing': 'Посмотреть цены',
      'Supported Applications': 'Поддерживаемые приложения',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        'Поддерживает настройку в один клик и полностью адаптируется к мультипротокольной конфигурации NewAPI.',
      'More Apps': 'Больше приложений',
      支持众多的大模型供应商:
        'Поддерживает множество поставщиков больших моделей',
    },
  },
  ja: {
    translation: {
      ...vibeCodingHomeResources.ja,
      'AI Application Infrastructure Foundation': 'AI アプリケーション基盤',
      'Unified API Gateway for': '幅広い AI モデル向けの',
      'Vast Range of AI Models': '統一 API ゲートウェイ',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        '標準化された統一 API プロトコルで多様なモデルにアクセスし、AI アプリケーションを強化し、デジタル資産を管理し、未来へつなげます。',
      'Go to Dashboard': 'ダッシュボードへ',
      Docs: 'ドキュメント',
      'Get Started': 'はじめる',
      'View Pricing': '料金を見る',
      'Supported Applications': '対応アプリケーション',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        'ワンクリック設定に対応し、NewAPI のマルチプロトコル構成にスムーズに適合します。',
      'More Apps': 'その他のアプリ',
      支持众多的大模型供应商:
        '様々な大規模言語モデルプロバイダーに対応しています',
    },
  },
  vi: {
    translation: {
      ...vibeCodingHomeResources.vi,
      'AI Application Infrastructure Foundation':
        'Nền tảng hạ tầng cho ứng dụng AI',
      'Unified API Gateway for': 'Cổng API hợp nhất cho',
      'Vast Range of AI Models': 'nhiều mô hình AI',
      'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.':
        'Truy cập nhiều mô hình thông qua một giao thức API chuẩn và hợp nhất. Vận hành ứng dụng AI, quản lý tài sản số và kết nối tương lai.',
      'Go to Dashboard': 'Đi tới bảng điều khiển',
      Docs: 'Tài liệu',
      'Get Started': 'Bắt đầu',
      'View Pricing': 'Xem giá',
      'Supported Applications': 'Ứng dụng được hỗ trợ',
      'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.':
        'Hỗ trợ cấu hình một chạm và tương thích hoàn hảo với cấu hình đa giao thức của NewAPI.',
      'More Apps': 'Thêm ứng dụng',
      支持众多的大模型供应商: 'Hỗ trợ nhiều nhà cung cấp LLM khác nhau',
    },
  },
};

Object.entries(resources).forEach(([language, resource]) => {
  i18n.addResourceBundle(
    language,
    'translation',
    resource.translation,
    true,
    true,
  );
});
