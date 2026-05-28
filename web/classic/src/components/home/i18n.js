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

const resources = {
  en: {
    translation: {
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
