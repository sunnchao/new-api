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
      总次数: 'Total requests',
      次数限制: 'Request limits',
      允许分组: 'Allowed groups',
      查看可用模型: 'View available models',
      支持的模型: 'Supported Models',
      '{{plan}} 可使用的模型': 'Models available for {{plan}}',
      无法加载可用模型: 'Unable to load supported models',
      '请刷新页面后重试。': 'Please refresh the page and try again.',
      暂未找到可用模型: 'No supported models found',
      '当前允许分组下暂无已启用模型。':
        'No enabled models match these groups yet.',
      在模型广场查看: 'View in Model Marketplace',
      打开模型广场: 'Open Model Marketplace',
      '另 {{count}} 项': '{{count}} more',
      订阅广场: 'Subscription Marketplace',
      使用情况: 'Usage',
      所有分组: 'All groups',
    },
  },
  'zh-CN': {
    translation: {
      总次数: '总次数',
      次数限制: '次数限制',
      允许分组: '允许分组',
      查看可用模型: '查看可用模型',
      支持的模型: '支持的模型',
      '{{plan}} 可使用的模型': '{{plan}} 可使用的模型',
      无法加载可用模型: '无法加载可用模型',
      '请刷新页面后重试。': '请刷新页面后重试。',
      暂未找到可用模型: '暂未找到可用模型',
      '当前允许分组下暂无已启用模型。': '当前允许分组下暂无已启用模型。',
      在模型广场查看: '在模型广场查看',
      打开模型广场: '打开模型广场',
      '另 {{count}} 项': '另 {{count}} 项',
      订阅广场: '订阅广场',
      使用情况: '使用情况',
      所有分组: '所有分组',
    },
  },
  'zh-TW': {
    translation: {
      总次数: '總次數',
      次数限制: '次數限制',
      允许分组: '允許分組',
      查看可用模型: '查看可用模型',
      支持的模型: '支援的模型',
      '{{plan}} 可使用的模型': '{{plan}} 可使用的模型',
      无法加载可用模型: '無法載入可用模型',
      '请刷新页面后重试。': '請重新整理頁面後再試。',
      暂未找到可用模型: '暫未找到可用模型',
      '当前允许分组下暂无已启用模型。': '目前允許分組下暫無已啟用模型。',
      在模型广场查看: '在模型廣場查看',
      打开模型广场: '打開模型廣場',
      '另 {{count}} 项': '另 {{count}} 項',
      订阅广场: '訂閱廣場',
      使用情况: '使用情況',
      所有分组: '所有分組',
    },
  },
  fr: {
    translation: {
      总次数: 'Requêtes totales',
      次数限制: 'Limites de requêtes',
      允许分组: 'Groupes autorisés',
      查看可用模型: 'Voir les modèles disponibles',
      支持的模型: 'Modèles pris en charge',
      '{{plan}} 可使用的模型': 'Modèles disponibles pour {{plan}}',
      无法加载可用模型: 'Impossible de charger les modèles disponibles',
      '请刷新页面后重试。': 'Actualisez la page et réessayez.',
      暂未找到可用模型: 'Aucun modèle disponible trouvé',
      '当前允许分组下暂无已启用模型。':
        'Aucun modèle activé ne correspond à ces groupes.',
      在模型广场查看: 'Voir dans le marché des modèles',
      打开模型广场: 'Ouvrir le marché des modèles',
      '另 {{count}} 项': '{{count}} de plus',
      订阅广场: 'Marché des abonnements',
      使用情况: 'Utilisation',
      所有分组: 'Tous les groupes',
    },
  },
  ja: {
    translation: {
      总次数: '合計リクエスト数',
      次数限制: 'リクエスト制限',
      允许分组: '許可グループ',
      查看可用模型: '利用可能なモデルを表示',
      支持的模型: '対応モデル',
      '{{plan}} 可使用的模型': '{{plan}} で利用可能なモデル',
      无法加载可用模型: '利用可能なモデルを読み込めません',
      '请刷新页面后重试。': 'ページを更新してもう一度お試しください。',
      暂未找到可用模型: '利用可能なモデルが見つかりません',
      '当前允许分组下暂无已启用模型。':
        'これらのグループに一致する有効なモデルはまだありません。',
      在模型广场查看: 'モデルマーケットプレイスで表示',
      打开模型广场: 'モデルマーケットプレイスを開く',
      '另 {{count}} 项': '他 {{count}} 件',
      订阅广场: 'サブスクリプション広場',
      使用情况: '利用状況',
      所有分组: 'すべてのグループ',
    },
  },
  ru: {
    translation: {
      总次数: 'Всего запросов',
      次数限制: 'Лимиты запросов',
      允许分组: 'Разрешенные группы',
      查看可用模型: 'Показать доступные модели',
      支持的模型: 'Поддерживаемые модели',
      '{{plan}} 可使用的模型': 'Модели, доступные для {{plan}}',
      无法加载可用模型: 'Не удалось загрузить доступные модели',
      '请刷新页面后重试。': 'Обновите страницу и повторите попытку.',
      暂未找到可用模型: 'Доступные модели не найдены',
      '当前允许分组下暂无已启用模型。':
        'Для этих групп пока нет включенных моделей.',
      在模型广场查看: 'Посмотреть на площадке моделей',
      打开模型广场: 'Открыть площадку моделей',
      '另 {{count}} 项': 'Еще {{count}}',
      订阅广场: 'Площадка подписок',
      使用情况: 'Использование',
      所有分组: 'Все группы',
    },
  },
  vi: {
    translation: {
      总次数: 'Tổng số lượt gọi',
      次数限制: 'Giới hạn lượt gọi',
      允许分组: 'Nhóm được phép',
      查看可用模型: 'Xem mô hình khả dụng',
      支持的模型: 'Mô hình được hỗ trợ',
      '{{plan}} 可使用的模型': 'Mô hình khả dụng cho {{plan}}',
      无法加载可用模型: 'Không thể tải mô hình khả dụng',
      '请刷新页面后重试。': 'Vui lòng làm mới trang và thử lại.',
      暂未找到可用模型: 'Không tìm thấy mô hình khả dụng',
      '当前允许分组下暂无已启用模型。':
        'Chưa có mô hình đã bật nào khớp với các nhóm này.',
      在模型广场查看: 'Xem trong Thị trường mô hình',
      打开模型广场: 'Mở Thị trường mô hình',
      '另 {{count}} 项': 'Thêm {{count}} mục',
      订阅广场: 'Quảng trường đăng ký',
      使用情况: 'Mức sử dụng',
      所有分组: 'Tất cả nhóm',
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
