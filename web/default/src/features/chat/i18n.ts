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
export const chatI18nResources = {
  en: {
    translation: {
      'Choose an enabled token to start the chat session.':
        'Choose an enabled token to start the chat session.',
      'Failed to load API key': 'Failed to load API key',
      'No enabled tokens available. Please create or enable a token first.':
        'No enabled tokens available. Please create or enable a token first.',
      'Select token': 'Select token',
      'Select token again': 'Select token again',
      'You cancelled token selection.': 'You cancelled token selection.',
    },
  },
  zh: {
    translation: {
      'Choose an enabled token to start the chat session.':
        '请选择一个已启用的令牌以开始聊天会话。',
      'Failed to load API key': '获取令牌失败',
      'No enabled tokens available. Please create or enable a token first.':
        '当前没有可用的启用令牌，请先创建或启用令牌。',
      'Select token': '选择令牌',
      'Select token again': '重新选择令牌',
      'You cancelled token selection.': '您已取消令牌选择。',
    },
  },
  fr: {
    translation: {
      'Choose an enabled token to start the chat session.':
        'Choisissez un jeton activé pour démarrer la session de chat.',
      'Failed to load API key': 'Échec du chargement de la clé API',
      'No enabled tokens available. Please create or enable a token first.':
        "Aucun jeton activé disponible. Veuillez d'abord créer ou activer un jeton.",
      'Select token': 'Sélectionner un jeton',
      'Select token again': 'Sélectionner à nouveau',
      'You cancelled token selection.': 'Vous avez annulé la sélection du jeton.',
    },
  },
  ja: {
    translation: {
      'Choose an enabled token to start the chat session.':
        '有効なトークンを選択してチャットセッションを開始してください。',
      'Failed to load API key': 'APIキーの読み込みに失敗しました',
      'No enabled tokens available. Please create or enable a token first.':
        '有効なトークンがありません。先にトークンを作成または有効化してください。',
      'Select token': 'トークンを選択',
      'Select token again': '再度選択',
      'You cancelled token selection.': 'トークンの選択をキャンセルしました。',
    },
  },
  ru: {
    translation: {
      'Choose an enabled token to start the chat session.':
        'Выберите активный токен для начала сеанса чата.',
      'Failed to load API key': 'Не удалось загрузить API-ключ',
      'No enabled tokens available. Please create or enable a token first.':
        'Нет доступных активных токенов. Сначала создайте или активируйте токен.',
      'Select token': 'Выбрать токен',
      'Select token again': 'Выбрать снова',
      'You cancelled token selection.': 'Вы отменили выбор токена.',
    },
  },
  vi: {
    translation: {
      'Choose an enabled token to start the chat session.':
        'Chọn một token đã kích hoạt để bắt đầu phiên chat.',
      'Failed to load API key': 'Không thể tải khóa API',
      'No enabled tokens available. Please create or enable a token first.':
        'Không có token nào được kích hoạt. Vui lòng tạo hoặc kích hoạt token trước.',
      'Select token': 'Chọn token',
      'Select token again': 'Chọn lại',
      'You cancelled token selection.': 'Bạn đã hủy chọn token.',
    },
  },
} as const
