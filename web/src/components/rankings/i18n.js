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

import i18n from '../../i18n/i18n';

const resources = {
  en: {
    translation: {
      'rankings.hero.label': 'Leaderboards',
      'rankings.hero.title': 'Rankings',
      'rankings.hero.description':
        'Discover the most-used models and rising vendors on the platform, updated from live usage data.',
      'rankings.period.today': 'Today',
      'rankings.period.week': 'Week',
      'rankings.period.month': 'Month',
      'rankings.period.year': 'Year',
      'rankings.period.all': 'All-time',
      'rankings.topModels.title': 'Top Models',
      'rankings.topModels.period.today':
        'Hourly token usage by model across the last 24 hours',
      'rankings.topModels.period.week':
        'Weekly token usage by model across the past few weeks',
      'rankings.topModels.period.month':
        'Daily token usage by model across the past month',
      'rankings.topModels.period.year':
        'Weekly token usage by model across the past year',
      'rankings.topModels.period.all':
        'Token usage by model since launch',
      'rankings.topModels.tokens': 'tokens',
      'rankings.topModels.noHistory': 'No history data available',
      'rankings.leaderboard.title': 'LLM Leaderboard',
      'rankings.leaderboard.description':
        'Compare the most popular models on the platform',
      'rankings.leaderboard.noModels':
        'No models match the selected filters',
      'rankings.leaderboard.by': 'by',
      'rankings.marketShare.title': 'Market Share',
      'rankings.marketShare.period.today':
        'Token share by model author across the last 24 hours',
      'rankings.marketShare.period.week':
        'Token share by model author across the past few weeks',
      'rankings.marketShare.period.month':
        'Token share by model author across the past month',
      'rankings.marketShare.period.year':
        'Token share by model author across the past year',
      'rankings.marketShare.period.all':
        'Token share by model author since launch',
      'rankings.marketShare.byAuthor': 'By model author',
      'rankings.marketShare.byAuthorDesc':
        'Vendors ranked by aggregated token volume',
      'rankings.marketShare.noVendors': 'No vendor data available',
      'rankings.marketShare.noHistory': 'No history data available',
      'rankings.pulse.up': 'Trending up',
      'rankings.pulse.upDesc': 'Models climbing the leaderboard',
      'rankings.pulse.down': 'Trending down',
      'rankings.pulse.downDesc': 'Models losing positions',
      'rankings.pulse.noClimbers': 'No notable climbers right now',
      'rankings.pulse.noDroppers': 'No notable drops right now',
      'rankings.error.title': 'Unable to load rankings',
      'rankings.more': '+{{count}} more',
      'rankings.total': 'Total:',
    },
  },
  'zh-CN': {
    translation: {
      'rankings.hero.label': '排行榜',
      'rankings.hero.title': '排名',
      'rankings.hero.description':
        '发现平台上使用最多的模型和上升最快的供应商，数据来自实时使用统计。',
      'rankings.period.today': '今天',
      'rankings.period.week': '本周',
      'rankings.period.month': '本月',
      'rankings.period.year': '本年',
      'rankings.period.all': '全部',
      'rankings.topModels.title': '热门模型',
      'rankings.topModels.period.today':
        '过去 24 小时内各模型的按小时 token 用量',
      'rankings.topModels.period.week':
        '过去几周内各模型的按周 token 用量',
      'rankings.topModels.period.month':
        '过去一个月内各模型的按天 token 用量',
      'rankings.topModels.period.year':
        '过去一年内各模型的按周 token 用量',
      'rankings.topModels.period.all': '自上线以来各模型的 token 用量',
      'rankings.topModels.tokens': 'tokens',
      'rankings.topModels.noHistory': '暂无历史数据',
      'rankings.leaderboard.title': 'LLM 排行榜',
      'rankings.leaderboard.description': '对比平台上最受欢迎的模型',
      'rankings.leaderboard.noModels': '没有模型匹配所选筛选条件',
      'rankings.leaderboard.by': '来自',
      'rankings.marketShare.title': '市场份额',
      'rankings.marketShare.period.today':
        '过去 24 小时内各供应商的 token 份额',
      'rankings.marketShare.period.week':
        '过去几周内各供应商的 token 份额',
      'rankings.marketShare.period.month':
        '过去一个月内各供应商的 token 份额',
      'rankings.marketShare.period.year':
        '过去一年内各供应商的 token 份额',
      'rankings.marketShare.period.all':
        '自上线以来各供应商的 token 份额',
      'rankings.marketShare.byAuthor': '按模型供应商',
      'rankings.marketShare.byAuthorDesc':
        '按 token 总量排名的供应商',
      'rankings.marketShare.noVendors': '暂无供应商数据',
      'rankings.marketShare.noHistory': '暂无历史数据',
      'rankings.pulse.up': '上升趋势',
      'rankings.pulse.upDesc': '排名上升的模型',
      'rankings.pulse.down': '下降趋势',
      'rankings.pulse.downDesc': '排名下降的模型',
      'rankings.pulse.noClimbers': '当前没有明显上升的模型',
      'rankings.pulse.noDroppers': '当前没有明显下降的模型',
      'rankings.error.title': '无法加载排名数据',
      'rankings.more': '还有 {{count}} 个',
      'rankings.total': '合计：',
    },
  },
  'zh-TW': {
    translation: {
      'rankings.hero.label': '排行榜',
      'rankings.hero.title': '排名',
      'rankings.hero.description':
        '發現平台上使用最多的模型和上升最快的供應商，數據來自即時使用統計。',
      'rankings.period.today': '今天',
      'rankings.period.week': '本週',
      'rankings.period.month': '本月',
      'rankings.period.year': '本年',
      'rankings.period.all': '全部',
      'rankings.topModels.title': '熱門模型',
      'rankings.topModels.period.today':
        '過去 24 小時內各模型的按小時 token 用量',
      'rankings.topModels.period.week':
        '過去幾週內各模型的按週 token 用量',
      'rankings.topModels.period.month':
        '過去一個月內各模型的按天 token 用量',
      'rankings.topModels.period.year':
        '過去一年內各模型的按週 token 用量',
      'rankings.topModels.period.all': '自上線以來各模型的 token 用量',
      'rankings.topModels.tokens': 'tokens',
      'rankings.topModels.noHistory': '暫無歷史資料',
      'rankings.leaderboard.title': 'LLM 排行榜',
      'rankings.leaderboard.description': '對比平台上最受歡迎的模型',
      'rankings.leaderboard.noModels': '沒有模型匹配所選篩選條件',
      'rankings.leaderboard.by': '來自',
      'rankings.marketShare.title': '市場份額',
      'rankings.marketShare.period.today':
        '過去 24 小時內各供應商的 token 份額',
      'rankings.marketShare.period.week':
        '過去幾週內各供應商的 token 份額',
      'rankings.marketShare.period.month':
        '過去一個月內各供應商的 token 份額',
      'rankings.marketShare.period.year':
        '過去一年內各供應商的 token 份額',
      'rankings.marketShare.period.all':
        '自上線以來各供應商的 token 份額',
      'rankings.marketShare.byAuthor': '按模型供應商',
      'rankings.marketShare.byAuthorDesc':
        '按 token 總量排名的供應商',
      'rankings.marketShare.noVendors': '暫無供應商資料',
      'rankings.marketShare.noHistory': '暫無歷史資料',
      'rankings.pulse.up': '上升趨勢',
      'rankings.pulse.upDesc': '排名上升的模型',
      'rankings.pulse.down': '下降趨勢',
      'rankings.pulse.downDesc': '排名下降的模型',
      'rankings.pulse.noClimbers': '目前沒有明顯上升的模型',
      'rankings.pulse.noDroppers': '目前沒有明顯下降的模型',
      'rankings.error.title': '無法載入排名資料',
      'rankings.more': '還有 {{count}} 個',
      'rankings.total': '合計：',
    },
  },
  fr: {
    translation: {
      'rankings.hero.label': 'Classements',
      'rankings.hero.title': 'Classement',
      'rankings.hero.description':
        'Découvrez les modèles les plus utilisés et les fournisseurs en hausse sur la plateforme, mis à jour en temps réel.',
      'rankings.period.today': "Aujourd'hui",
      'rankings.period.week': 'Semaine',
      'rankings.period.month': 'Mois',
      'rankings.period.year': 'Année',
      'rankings.period.all': 'Tout',
      'rankings.topModels.title': 'Top modèles',
      'rankings.topModels.period.today':
        'Utilisation horaire par modèle sur les 24 dernières heures',
      'rankings.topModels.period.week':
        'Utilisation hebdomadaire par modèle sur les dernières semaines',
      'rankings.topModels.period.month':
        'Utilisation quotidienne par modèle sur le dernier mois',
      'rankings.topModels.period.year':
        'Utilisation hebdomadaire par modèle sur la dernière année',
      'rankings.topModels.period.all':
        "Utilisation par modèle depuis le lancement",
      'rankings.topModels.tokens': 'tokens',
      'rankings.topModels.noHistory': 'Aucune donnée historique',
      'rankings.leaderboard.title': 'Classement LLM',
      'rankings.leaderboard.description':
        'Comparez les modèles les plus populaires sur la plateforme',
      'rankings.leaderboard.noModels':
        'Aucun modèle ne correspond aux filtres sélectionnés',
      'rankings.leaderboard.by': 'par',
      'rankings.marketShare.title': 'Part de marché',
      'rankings.marketShare.period.today':
        'Part de tokens par auteur sur les 24 dernières heures',
      'rankings.marketShare.period.week':
        'Part de tokens par auteur sur les dernières semaines',
      'rankings.marketShare.period.month':
        'Part de tokens par auteur sur le dernier mois',
      'rankings.marketShare.period.year':
        'Part de tokens par auteur sur la dernière année',
      'rankings.marketShare.period.all':
        "Part de tokens par auteur depuis le lancement",
      'rankings.marketShare.byAuthor': 'Par auteur de modèle',
      'rankings.marketShare.byAuthorDesc':
        'Fournisseurs classés par volume de tokens',
      'rankings.marketShare.noVendors': 'Aucune donnée fournisseur',
      'rankings.marketShare.noHistory': 'Aucune donnée historique',
      'rankings.pulse.up': 'En hausse',
      'rankings.pulse.upDesc': 'Modèles en progression',
      'rankings.pulse.down': 'En baisse',
      'rankings.pulse.downDesc': 'Modèles en recul',
      'rankings.pulse.noClimbers': 'Pas de progression notable',
      'rankings.pulse.noDroppers': 'Pas de baisse notable',
      'rankings.error.title': 'Impossible de charger les classements',
      'rankings.more': '+{{count}} de plus',
      'rankings.total': 'Total :',
    },
  },
  ru: {
    translation: {
      'rankings.hero.label': 'Рейтинги',
      'rankings.hero.title': 'Рейтинг',
      'rankings.hero.description':
        'Узнайте самые популярные модели и растущих поставщиков на платформе по данным использования в реальном времени.',
      'rankings.period.today': 'Сегодня',
      'rankings.period.week': 'Неделя',
      'rankings.period.month': 'Месяц',
      'rankings.period.year': 'Год',
      'rankings.period.all': 'Все время',
      'rankings.topModels.title': 'Топ моделей',
      'rankings.topModels.period.today':
        'Использование токенов по часам за последние 24 часа',
      'rankings.topModels.period.week':
        'Использование токенов по неделям за последние недели',
      'rankings.topModels.period.month':
        'Использование токенов по дням за последний месяц',
      'rankings.topModels.period.year':
        'Использование токенов по неделям за последний год',
      'rankings.topModels.period.all':
        'Использование токенов с момента запуска',
      'rankings.topModels.tokens': 'токены',
      'rankings.topModels.noHistory': 'Нет исторических данных',
      'rankings.leaderboard.title': 'Рейтинг LLM',
      'rankings.leaderboard.description':
        'Сравните самые популярные модели на платформе',
      'rankings.leaderboard.noModels':
        'Нет моделей, соответствующих выбранным фильтрам',
      'rankings.leaderboard.by': 'от',
      'rankings.marketShare.title': 'Доля рынка',
      'rankings.marketShare.period.today':
        'Доля токенов по поставщикам за последние 24 часа',
      'rankings.marketShare.period.week':
        'Доля токенов по поставщикам за последние недели',
      'rankings.marketShare.period.month':
        'Доля токенов по поставщикам за последний месяц',
      'rankings.marketShare.period.year':
        'Доля токенов по поставщикам за последний год',
      'rankings.marketShare.period.all':
        'Доля токенов по поставщикам с момента запуска',
      'rankings.marketShare.byAuthor': 'По поставщику моделей',
      'rankings.marketShare.byAuthorDesc':
        'Поставщики по объёму токенов',
      'rankings.marketShare.noVendors': 'Нет данных о поставщиках',
      'rankings.marketShare.noHistory': 'Нет исторических данных',
      'rankings.pulse.up': 'Рост',
      'rankings.pulse.upDesc': 'Модели, поднимающиеся в рейтинге',
      'rankings.pulse.down': 'Спад',
      'rankings.pulse.downDesc': 'Модели, теряющие позиции',
      'rankings.pulse.noClimbers': 'Нет заметного роста',
      'rankings.pulse.noDroppers': 'Нет заметного спада',
      'rankings.error.title': 'Не удалось загрузить рейтинги',
      'rankings.more': 'Ещё {{count}}',
      'rankings.total': 'Итого:',
    },
  },
  ja: {
    translation: {
      'rankings.hero.label': 'ランキング',
      'rankings.hero.title': 'ランキング',
      'rankings.hero.description':
        'プラットフォームで最も使用されているモデルと成長中のベンダーをリアルタイムデータから発見。',
      'rankings.period.today': '今日',
      'rankings.period.week': '今週',
      'rankings.period.month': '今月',
      'rankings.period.year': '今年',
      'rankings.period.all': '全期間',
      'rankings.topModels.title': '人気モデル',
      'rankings.topModels.period.today':
        '過去24時間のモデル別時間帯別トークン使用量',
      'rankings.topModels.period.week':
        '過去数週間のモデル別週別トークン使用量',
      'rankings.topModels.period.month':
        '過去1ヶ月のモデル別日別トークン使用量',
      'rankings.topModels.period.year':
        '過去1年のモデル別週別トークン使用量',
      'rankings.topModels.period.all':
        '開始以来のモデル別トークン使用量',
      'rankings.topModels.tokens': 'トークン',
      'rankings.topModels.noHistory': '履歴データがありません',
      'rankings.leaderboard.title': 'LLM ランキング',
      'rankings.leaderboard.description':
        'プラットフォームで最も人気のあるモデルを比較',
      'rankings.leaderboard.noModels':
        '選択したフィルターに一致するモデルがありません',
      'rankings.leaderboard.by': 'by',
      'rankings.marketShare.title': '市場シェア',
      'rankings.marketShare.period.today':
        '過去24時間のベンダー別トークンシェア',
      'rankings.marketShare.period.week':
        '過去数週間のベンダー別トークンシェア',
      'rankings.marketShare.period.month':
        '過去1ヶ月のベンダー別トークンシェア',
      'rankings.marketShare.period.year':
        '過去1年のベンダー別トークンシェア',
      'rankings.marketShare.period.all':
        '開始以来のベンダー別トークンシェア',
      'rankings.marketShare.byAuthor': 'モデル提供元別',
      'rankings.marketShare.byAuthorDesc':
        'トークン量順のベンダーランキング',
      'rankings.marketShare.noVendors': 'ベンダーデータがありません',
      'rankings.marketShare.noHistory': '履歴データがありません',
      'rankings.pulse.up': '上昇トレンド',
      'rankings.pulse.upDesc': 'ランキングを上昇中のモデル',
      'rankings.pulse.down': '下降トレンド',
      'rankings.pulse.downDesc': 'ランキングを下降中のモデル',
      'rankings.pulse.noClimbers': '目立った上昇はありません',
      'rankings.pulse.noDroppers': '目立った下降はありません',
      'rankings.error.title': 'ランキングデータを読み込めません',
      'rankings.more': '他 {{count}} 件',
      'rankings.total': '合計：',
    },
  },
  vi: {
    translation: {
      'rankings.hero.label': 'Bảng xếp hạng',
      'rankings.hero.title': 'Xếp hạng',
      'rankings.hero.description':
        'Khám phá các model được sử dụng nhiều nhất và các nhà cung cấp đang tăng trưởng trên nền tảng, được cập nhật từ dữ liệu sử dụng thực tế.',
      'rankings.period.today': 'Hôm nay',
      'rankings.period.week': 'Tuần',
      'rankings.period.month': 'Tháng',
      'rankings.period.year': 'Năm',
      'rankings.period.all': 'Tất cả',
      'rankings.topModels.title': 'Model hàng đầu',
      'rankings.topModels.period.today':
        'Sử dụng token theo giờ của các model trong 24 giờ qua',
      'rankings.topModels.period.week':
        'Sử dụng token theo tuần của các model trong vài tuần qua',
      'rankings.topModels.period.month':
        'Sử dụng token theo ngày của các model trong tháng qua',
      'rankings.topModels.period.year':
        'Sử dụng token theo tuần của các model trong năm qua',
      'rankings.topModels.period.all':
        'Sử dụng token của các model từ khi ra mắt',
      'rankings.topModels.tokens': 'token',
      'rankings.topModels.noHistory': 'Không có dữ liệu lịch sử',
      'rankings.leaderboard.title': 'Bảng xếp hạng LLM',
      'rankings.leaderboard.description':
        'So sánh các model phổ biến nhất trên nền tảng',
      'rankings.leaderboard.noModels':
        'Không có model phù hợp với bộ lọc đã chọn',
      'rankings.leaderboard.by': 'bởi',
      'rankings.marketShare.title': 'Thị phần',
      'rankings.marketShare.period.today':
        'Thị phần token theo nhà cung cấp trong 24 giờ qua',
      'rankings.marketShare.period.week':
        'Thị phần token theo nhà cung cấp trong vài tuần qua',
      'rankings.marketShare.period.month':
        'Thị phần token theo nhà cung cấp trong tháng qua',
      'rankings.marketShare.period.year':
        'Thị phần token theo nhà cung cấp trong năm qua',
      'rankings.marketShare.period.all':
        'Thị phần token theo nhà cung cấp từ khi ra mắt',
      'rankings.marketShare.byAuthor': 'Theo nhà cung cấp model',
      'rankings.marketShare.byAuthorDesc':
        'Nhà cung cấp xếp hạng theo tổng lượng token',
      'rankings.marketShare.noVendors': 'Không có dữ liệu nhà cung cấp',
      'rankings.marketShare.noHistory': 'Không có dữ liệu lịch sử',
      'rankings.pulse.up': 'Xu hướng tăng',
      'rankings.pulse.upDesc': 'Các model đang tăng hạng',
      'rankings.pulse.down': 'Xu hướng giảm',
      'rankings.pulse.downDesc': 'Các model đang giảm hạng',
      'rankings.pulse.noClimbers': 'Không có model tăng đáng kể',
      'rankings.pulse.noDroppers': 'Không có model giảm đáng kể',
      'rankings.error.title': 'Không thể tải dữ liệu xếp hạng',
      'rankings.more': '+{{count}} thêm',
      'rankings.total': 'Tổng:',
    },
  },
};

Object.entries(resources).forEach(([language, resource]) => {
  i18n.addResourceBundle(language, 'translation', resource.translation, true, true);
});
