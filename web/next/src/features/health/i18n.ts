/*
Copyright (C) 2023-2026 QuantumNous

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

import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      health: {
        dashboard: {
          title: 'Health Dashboard',
          autoRefresh: 'Auto refresh',
          refresh: 'Refresh',
          adminOnly: 'Admins only.',
        },
        stats: {
          totalModels: 'Total Models',
          healthy: 'Healthy',
          degraded: 'Degraded',
          offline: 'Offline',
          unknown: 'Unknown',
        },
        status: {
          healthy: 'Healthy',
          degraded: 'Degraded',
          offline: 'Offline',
          unknown: 'Unknown',
        },
        table: {
          searchModel: 'Search model',
          filterStatus: 'Filter status',
          allStatuses: 'All statuses',
          sortByStatus: 'Sort by status',
          sortByName: 'Sort by name',
          modelName: 'Model',
          status: 'Status',
          channels: 'Channels',
          avgLatency: 'Avg Latency',
          lastTested: 'Last Tested',
          noData: 'No data',
        },
        channel: {
          name: 'Channel',
          status: 'Status',
          responseTime: 'Response',
          priority: 'Priority',
          weight: 'Weight',
          lastCheck: 'Last Check',
          enabled: 'Enabled',
          autoDisabled: 'Auto disabled',
          disabled: 'Disabled',
          test: 'Test',
          testing: 'Testing',
          testPassed: 'Test passed ({{latency}})',
          testFailed: 'Test failed',
          noChannels: 'No channels',
        },
        trend: {
          latencyTitle: 'Average Latency by Model',
          availabilityTitle: 'Success Rate by Model',
          ttft: 'Avg latency',
          successRate: 'Success rate',
          noLatencyData: 'No latency data',
          noAvailabilityData: 'No availability data',
        },
      },
    },
  },
  zh: {
    translation: {
      health: {
        dashboard: {
          title: '健康仪表盘',
          autoRefresh: '自动刷新',
          refresh: '刷新',
          adminOnly: '仅管理员可访问。',
        },
        stats: {
          totalModels: '模型总数',
          healthy: '健康',
          degraded: '降级',
          offline: '离线',
          unknown: '未知',
        },
        status: {
          healthy: '健康',
          degraded: '降级',
          offline: '离线',
          unknown: '未知',
        },
        table: {
          searchModel: '搜索模型',
          filterStatus: '筛选状态',
          allStatuses: '全部状态',
          sortByStatus: '按状态排序',
          sortByName: '按名称排序',
          modelName: '模型',
          status: '状态',
          channels: '渠道',
          avgLatency: '平均延迟',
          lastTested: '最近测试',
          noData: '暂无数据',
        },
        channel: {
          name: '渠道',
          status: '状态',
          responseTime: '响应时间',
          priority: '优先级',
          weight: '权重',
          lastCheck: '最近检查',
          enabled: '已启用',
          autoDisabled: '自动禁用',
          disabled: '已禁用',
          test: '测试',
          testing: '测试中',
          testPassed: '测试通过（{{latency}}）',
          testFailed: '测试失败',
          noChannels: '暂无渠道',
        },
        trend: {
          latencyTitle: '按模型平均延迟',
          availabilityTitle: '按模型成功率',
          ttft: '平均延迟',
          successRate: '成功率',
          noLatencyData: '暂无延迟数据',
          noAvailabilityData: '暂无可用性数据',
        },
      },
    },
  },
  fr: {
    translation: {
      health: {
        dashboard: {
          title: 'Tableau de bord sante',
          autoRefresh: 'Actualisation auto',
          refresh: 'Actualiser',
          adminOnly: 'Reserve aux administrateurs.',
        },
        stats: {
          totalModels: 'Total des modeles',
          healthy: 'Sain',
          degraded: 'Degrade',
          offline: 'Hors ligne',
          unknown: 'Inconnu',
        },
        status: {
          healthy: 'Sain',
          degraded: 'Degrade',
          offline: 'Hors ligne',
          unknown: 'Inconnu',
        },
        table: {
          searchModel: 'Rechercher un modele',
          filterStatus: 'Filtrer le statut',
          allStatuses: 'Tous les statuts',
          sortByStatus: 'Trier par statut',
          sortByName: 'Trier par nom',
          modelName: 'Modele',
          status: 'Statut',
          channels: 'Canaux',
          avgLatency: 'Latence moy.',
          lastTested: 'Dernier test',
          noData: 'Aucune donnee',
        },
        channel: {
          name: 'Canal',
          status: 'Statut',
          responseTime: 'Reponse',
          priority: 'Priorite',
          weight: 'Poids',
          lastCheck: 'Dernier controle',
          enabled: 'Active',
          autoDisabled: 'Desactive auto',
          disabled: 'Desactive',
          test: 'Tester',
          testing: 'Test en cours',
          testPassed: 'Test reussi ({{latency}})',
          testFailed: 'Echec du test',
          noChannels: 'Aucun canal',
        },
        trend: {
          latencyTitle: 'Latence moyenne par modele',
          availabilityTitle: 'Taux de reussite par modele',
          ttft: 'Latence moyenne',
          successRate: 'Taux de reussite',
          noLatencyData: 'Aucune donnee de latence',
          noAvailabilityData: 'Aucune donnee de disponibilite',
        },
      },
    },
  },
  ja: {
    translation: {
      health: {
        dashboard: {
          title: 'ヘルスダッシュボード',
          autoRefresh: '自動更新',
          refresh: '更新',
          adminOnly: '管理者専用です。',
        },
        stats: {
          totalModels: 'モデル総数',
          healthy: '正常',
          degraded: '劣化',
          offline: 'オフライン',
          unknown: '不明',
        },
        status: {
          healthy: '正常',
          degraded: '劣化',
          offline: 'オフライン',
          unknown: '不明',
        },
        table: {
          searchModel: 'モデルを検索',
          filterStatus: 'ステータスで絞り込み',
          allStatuses: '全ステータス',
          sortByStatus: 'ステータス順',
          sortByName: '名前順',
          modelName: 'モデル',
          status: 'ステータス',
          channels: 'チャンネル',
          avgLatency: '平均遅延',
          lastTested: '最終テスト',
          noData: 'データなし',
        },
        channel: {
          name: 'チャンネル',
          status: 'ステータス',
          responseTime: '応答時間',
          priority: '優先度',
          weight: '重み',
          lastCheck: '最終チェック',
          enabled: '有効',
          autoDisabled: '自動無効',
          disabled: '無効',
          test: 'テスト',
          testing: 'テスト中',
          testPassed: 'テスト成功（{{latency}}）',
          testFailed: 'テスト失敗',
          noChannels: 'チャンネルなし',
        },
        trend: {
          latencyTitle: 'モデル別平均遅延',
          availabilityTitle: 'モデル別成功率',
          ttft: '平均遅延',
          successRate: '成功率',
          noLatencyData: '遅延データなし',
          noAvailabilityData: '可用性データなし',
        },
      },
    },
  },
  ru: {
    translation: {
      health: {
        dashboard: {
          title: 'Панель здоровья',
          autoRefresh: 'Автообновление',
          refresh: 'Обновить',
          adminOnly: 'Только для администраторов.',
        },
        stats: {
          totalModels: 'Всего моделей',
          healthy: 'Здоровые',
          degraded: 'Деградация',
          offline: 'Офлайн',
          unknown: 'Неизвестно',
        },
        status: {
          healthy: 'Здоровый',
          degraded: 'Деградация',
          offline: 'Офлайн',
          unknown: 'Неизвестно',
        },
        table: {
          searchModel: 'Поиск модели',
          filterStatus: 'Фильтр статуса',
          allStatuses: 'Все статусы',
          sortByStatus: 'Сортировать по статусу',
          sortByName: 'Сортировать по имени',
          modelName: 'Модель',
          status: 'Статус',
          channels: 'Каналы',
          avgLatency: 'Ср. задержка',
          lastTested: 'Последний тест',
          noData: 'Нет данных',
        },
        channel: {
          name: 'Канал',
          status: 'Статус',
          responseTime: 'Ответ',
          priority: 'Приоритет',
          weight: 'Вес',
          lastCheck: 'Последняя проверка',
          enabled: 'Включён',
          autoDisabled: 'Авто-отключён',
          disabled: 'Отключён',
          test: 'Тест',
          testing: 'Тестирование',
          testPassed: 'Тест пройден ({{latency}})',
          testFailed: 'Тест не пройден',
          noChannels: 'Нет каналов',
        },
        trend: {
          latencyTitle: 'Средняя задержка по моделям',
          availabilityTitle: 'Успешность по моделям',
          ttft: 'Средняя задержка',
          successRate: 'Успешность',
          noLatencyData: 'Нет данных о задержке',
          noAvailabilityData: 'Нет данных о доступности',
        },
      },
    },
  },
  vi: {
    translation: {
      health: {
        dashboard: {
          title: 'Bang dieu khien suc khoe',
          autoRefresh: 'Tu dong lam moi',
          refresh: 'Lam moi',
          adminOnly: 'Chi danh cho quan tri vien.',
        },
        stats: {
          totalModels: 'Tong so mo hinh',
          healthy: 'Tot',
          degraded: 'Suy giam',
          offline: 'Ngoai tuyen',
          unknown: 'Khong ro',
        },
        status: {
          healthy: 'Tot',
          degraded: 'Suy giam',
          offline: 'Ngoai tuyen',
          unknown: 'Khong ro',
        },
        table: {
          searchModel: 'Tim mo hinh',
          filterStatus: 'Loc trang thai',
          allStatuses: 'Tat ca trang thai',
          sortByStatus: 'Sap xep theo trang thai',
          sortByName: 'Sap xep theo ten',
          modelName: 'Mo hinh',
          status: 'Trang thai',
          channels: 'Kenh',
          avgLatency: 'Do tre TB',
          lastTested: 'Kiem tra gan nhat',
          noData: 'Khong co du lieu',
        },
        channel: {
          name: 'Kenh',
          status: 'Trang thai',
          responseTime: 'Phan hoi',
          priority: 'Uu tien',
          weight: 'Trong so',
          lastCheck: 'Kiem tra cuoi',
          enabled: 'Da bat',
          autoDisabled: 'Tu dong tat',
          disabled: 'Da tat',
          test: 'Kiem tra',
          testing: 'Dang kiem tra',
          testPassed: 'Kiem tra dat ({{latency}})',
          testFailed: 'Kiem tra that bai',
          noChannels: 'Khong co kenh',
        },
        trend: {
          latencyTitle: 'Do tre trung binh theo mo hinh',
          availabilityTitle: 'Ty le thanh cong theo mo hinh',
          ttft: 'Do tre trung binh',
          successRate: 'Ty le thanh cong',
          noLatencyData: 'Khong co du lieu do tre',
          noAvailabilityData: 'Khong co du lieu kha dung',
        },
      },
    },
  },
} as const

for (const [language, resource] of Object.entries(resources)) {
  i18n.addResourceBundle(language, 'translation', resource.translation, true, true)
}
