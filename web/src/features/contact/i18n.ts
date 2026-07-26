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
      'Support channels': 'Support channels',
      'Contact us': 'Contact us',
      'Classic homepage contact details.': 'Classic homepage contact details.',
      'Email support': 'Email support',
      'Reply within 24 hours.': 'Reply within 24 hours.',
      'QQ group': 'QQ group',
      'User updates and community help.': 'User updates and community help.',
      'View QR code': 'View QR code',
      'Copy contact': 'Copy contact',
      'Copied!': 'Copied!',
      'Quick join': 'Quick join',
      'QQ group QR code': 'QQ group QR code',
      'Scan the QR code to join the QQ group.':
        'Scan the QR code to join the QQ group.',
    },
  },
  zh: {
    translation: {
      'Support channels': '支持渠道',
      'Contact us': '联系我们',
      'Classic homepage contact details.': '经典首页联系方式。',
      'Email support': '邮件支持',
      'Reply within 24 hours.': '24 小时内回复。',
      'QQ group': 'QQ 群',
      'User updates and community help.': '用户更新与社区互助。',
      'View QR code': '查看二维码',
      'Copy contact': '复制联系方式',
      'Copied!': '已复制！',
      'Quick join': '一键加群',
      'QQ group QR code': 'QQ 群二维码',
      'Scan the QR code to join the QQ group.': '扫描二维码加入 QQ 群。',
    },
  },
  fr: {
    translation: {
      'Support channels': "Canaux d'assistance",
      'Contact us': 'Contactez-nous',
      'Classic homepage contact details.':
        "Coordonnées de la page d'accueil classique.",
      'Email support': 'Assistance par e-mail',
      'Reply within 24 hours.': 'Réponse sous 24 heures.',
      'QQ group': 'Groupe QQ',
      'User updates and community help.':
        'Mises à jour utilisateurs et aide communautaire.',
      'View QR code': 'Voir le QR code',
      'Copy contact': 'Copier le contact',
      'Copied!': 'Copié !',
      'Quick join': 'Rejoindre',
      'QQ group QR code': 'QR code du groupe QQ',
      'Scan the QR code to join the QQ group.':
        'Scannez le QR code pour rejoindre le groupe QQ.',
    },
  },
  ja: {
    translation: {
      'Support channels': 'サポートチャンネル',
      'Contact us': 'お問い合わせ',
      'Classic homepage contact details.':
        'クラシックホームページの連絡先情報。',
      'Email support': 'メールサポート',
      'Reply within 24 hours.': '24時間以内に返信。',
      'QQ group': 'QQグループ',
      'User updates and community help.':
        'ユーザーアップデートとコミュニティヘルプ。',
      'View QR code': 'QRコードを表示',
      'Copy contact': '連絡先をコピー',
      'Copied!': 'コピーしました！',
      'Quick join': '参加する',
      'QQ group QR code': 'QQグループのQRコード',
      'Scan the QR code to join the QQ group.':
        'QRコードをスキャンしてQQグループに参加。',
    },
  },
  ru: {
    translation: {
      'Support channels': 'Каналы поддержки',
      'Contact us': 'Свяжитесь с нами',
      'Classic homepage contact details.':
        'Контактные данные классической домашней страницы.',
      'Email support': 'Поддержка по электронной почте',
      'Reply within 24 hours.': 'Ответ в течение 24 часов.',
      'QQ group': 'Группа QQ',
      'User updates and community help.':
        'Обновления пользователей и помощь сообщества.',
      'View QR code': 'Просмотреть QR-код',
      'Copy contact': 'Копировать контакт',
      'Copied!': 'Скопировано!',
      'Quick join': 'Присоединиться',
      'QQ group QR code': 'QR-код группы QQ',
      'Scan the QR code to join the QQ group.':
        'Отсканируйте QR-код, чтобы присоединиться к группе QQ.',
    },
  },
  vi: {
    translation: {
      'Support channels': 'Kênh hỗ trợ',
      'Contact us': 'Liên hệ với chúng tôi',
      'Classic homepage contact details.':
        'Thông tin liên hệ trang chủ cổ điển.',
      'Email support': 'Hỗ trợ qua email',
      'Reply within 24 hours.': 'Phản hồi trong vòng 24 giờ.',
      'QQ group': 'Nhóm QQ',
      'User updates and community help.':
        'Cập nhật người dùng và hỗ trợ cộng đồng.',
      'View QR code': 'Xem mã QR',
      'Copy contact': 'Sao chép liên hệ',
      'Copied!': 'Đã sao chép!',
      'Quick join': 'Tham gia ngay',
      'QQ group QR code': 'Mã QR nhóm QQ',
      'Scan the QR code to join the QQ group.':
        'Quét mã QR để tham gia nhóm QQ.',
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
