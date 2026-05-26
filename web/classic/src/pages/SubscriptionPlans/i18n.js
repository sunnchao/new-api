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
      订阅目录: 'Subscription catalog',
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        'Browse available subscription plans and choose the access package that fits your usage.',
      权益与价格一目了然: 'Benefits and pricing at a glance',
      登录后可直接订阅: 'Signed in and ready to subscribe',
      登录后即可订阅: 'Sign in to subscribe',
      可用套餐: 'Available plans',
      '共 {{count}} 个套餐': '{{count}} plan(s) available',
      刷新: 'Refresh',
      无法加载订阅套餐: 'Unable to load subscription plans',
      '请刷新页面重试。': 'Please refresh the page and try again.',
      重新加载: 'Reload',
      暂无可用订阅套餐: 'No subscription plans available',
      '目前没有已启用的订阅套餐。':
        'There are no enabled subscription plans yet.',
    },
  },
  'zh-CN': {
    translation: {
      订阅目录: '订阅目录',
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        '浏览可用的订阅套餐，选择适合您使用场景的权益包。',
      权益与价格一目了然: '权益与价格一目了然',
      登录后可直接订阅: '登录后可直接订阅',
      登录后即可订阅: '登录后即可订阅',
      可用套餐: '可用套餐',
      '共 {{count}} 个套餐': '共 {{count}} 个套餐',
      刷新: '刷新',
      无法加载订阅套餐: '无法加载订阅套餐',
      '请刷新页面重试。': '请刷新页面重试。',
      重新加载: '重新加载',
      暂无可用订阅套餐: '暂无可用订阅套餐',
      '目前没有已启用的订阅套餐。': '目前没有已启用的订阅套餐。',
    },
  },
  'zh-TW': {
    translation: {
      订阅目录: '訂閱目錄',
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        '瀏覽可用的訂閱方案，選擇適合您使用場景的權益包。',
      权益与价格一目了然: '權益與價格一目了然',
      登录后可直接订阅: '登入後可直接訂閱',
      登录后即可订阅: '登入後即可訂閱',
      可用套餐: '可用方案',
      '共 {{count}} 个套餐': '共 {{count}} 個方案',
      刷新: '重新整理',
      无法加载订阅套餐: '無法載入訂閱方案',
      '请刷新页面重试。': '請重新整理頁面後再試。',
      重新加载: '重新載入',
      暂无可用订阅套餐: '暫無可用訂閱方案',
      '目前没有已启用的订阅套餐。': '目前沒有已啟用的訂閱方案。',
    },
  },
  fr: {
    translation: {
      订阅目录: "Catalogue d'abonnements",
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        'Parcourez les offres disponibles et choisissez celle qui correspond à votre usage.',
      权益与价格一目了然: 'Avantages et prix en un coup d’œil',
      登录后可直接订阅: 'Connecté, prêt à souscrire',
      登录后即可订阅: 'Connectez-vous pour souscrire',
      可用套餐: 'Offres disponibles',
      '共 {{count}} 个套餐': '{{count}} offre(s) disponible(s)',
      刷新: 'Actualiser',
      无法加载订阅套餐: 'Impossible de charger les offres',
      '请刷新页面重试。': 'Actualisez la page et réessayez.',
      重新加载: 'Recharger',
      暂无可用订阅套餐: 'Aucune offre disponible',
      '目前没有已启用的订阅套餐。': 'Aucune offre activée pour le moment.',
    },
  },
  ja: {
    translation: {
      订阅目录: 'サブスクリプションカタログ',
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        '利用可能なプランを確認し、用途に合うアクセスパッケージを選択してください。',
      权益与价格一目了然: '特典と価格をひと目で確認',
      登录后可直接订阅: 'ログイン済み、すぐに購読できます',
      登录后即可订阅: 'ログインして購読',
      可用套餐: '利用可能なプラン',
      '共 {{count}} 个套餐': '{{count}} 件のプラン',
      刷新: '更新',
      无法加载订阅套餐: 'プランを読み込めません',
      '请刷新页面重试。': 'ページを更新してもう一度お試しください。',
      重新加载: '再読み込み',
      暂无可用订阅套餐: '利用可能なプランはありません',
      '目前没有已启用的订阅套餐。':
        '現在、有効なサブスクリプションプランはありません。',
    },
  },
  ru: {
    translation: {
      订阅目录: 'Каталог подписок',
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        'Просмотрите доступные планы подписки и выберите пакет, подходящий вашему сценарию.',
      权益与价格一目了然: 'Преимущества и цены с первого взгляда',
      登录后可直接订阅: 'Вы вошли и можете оформить подписку',
      登录后即可订阅: 'Войдите, чтобы оформить подписку',
      可用套餐: 'Доступные планы',
      '共 {{count}} 个套餐': 'Доступно планов: {{count}}',
      刷新: 'Обновить',
      无法加载订阅套餐: 'Не удалось загрузить планы подписки',
      '请刷新页面重试。': 'Обновите страницу и попробуйте снова.',
      重新加载: 'Загрузить снова',
      暂无可用订阅套餐: 'Нет доступных планов подписки',
      '目前没有已启用的订阅套餐。': 'Сейчас нет включенных планов подписки.',
    },
  },
  vi: {
    translation: {
      订阅目录: 'Danh mục gói đăng ký',
      '浏览可用的订阅套餐，选择适合您使用场景的权益包。':
        'Xem các gói đăng ký hiện có và chọn gói quyền lợi phù hợp với nhu cầu sử dụng.',
      权益与价格一目了然: 'Quyền lợi và giá rõ ràng',
      登录后可直接订阅: 'Đã đăng nhập, có thể đăng ký ngay',
      登录后即可订阅: 'Đăng nhập để đăng ký',
      可用套餐: 'Gói khả dụng',
      '共 {{count}} 个套餐': 'Có {{count}} gói',
      刷新: 'Làm mới',
      无法加载订阅套餐: 'Không thể tải gói đăng ký',
      '请刷新页面重试。': 'Vui lòng làm mới trang và thử lại.',
      重新加载: 'Tải lại',
      暂无可用订阅套餐: 'Chưa có gói đăng ký khả dụng',
      '目前没有已启用的订阅套餐。': 'Hiện chưa có gói đăng ký nào được bật.',
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
