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
      联系我们: 'Contact Us',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        'Our team is ready to help with questions you encounter while using the service.',
      支持渠道: 'Support channels',
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        'For account, plan, integration, or usage questions, contact the team through these channels.',
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        'For complex issues, email a short description with your account details so we can locate the problem faster.',
      直达支持: 'Direct support',
      邮件支持: 'Email support',
      '发送邮件联系我们，通常在24小时内回复':
        'Send us an email; we usually reply within 24 hours.',
      邮箱地址: 'Email address',
      复制邮箱: 'Copy email',
      发送邮件: 'Send email',
      'QQ 交流群': 'QQ group',
      '加入用户交流群，获取最新资讯':
        'Join the user group for updates and community help.',
      群号: 'Group ID',
      复制群号: 'Copy group ID',
      查看二维码: 'View QR code',
      一键加群: 'Quick join',
      '扫码加入 QQ 交流群': 'Scan to join the QQ group',
      '扫码加入群聊，或复制群号手动搜索。':
        'Scan to join the group, or copy the group ID and search manually.',
      'QQ 交流群二维码': 'QQ group QR code',
      复制成功: 'Copied',
    },
  },
  'zh-CN': {
    translation: {
      联系我们: '联系我们',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题',
      支持渠道: '支持渠道',
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。',
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。',
      直达支持: '直达支持',
      邮件支持: '邮件支持',
      '发送邮件联系我们，通常在24小时内回复':
        '发送邮件联系我们，通常在24小时内回复',
      邮箱地址: '邮箱地址',
      复制邮箱: '复制邮箱',
      发送邮件: '发送邮件',
      'QQ 交流群': 'QQ 交流群',
      '加入用户交流群，获取最新资讯': '加入用户交流群，获取最新资讯',
      群号: '群号',
      复制群号: '复制群号',
      查看二维码: '查看二维码',
      一键加群: '一键加群',
      '扫码加入 QQ 交流群': '扫码加入 QQ 交流群',
      '扫码加入群聊，或复制群号手动搜索。':
        '扫码加入群聊，或复制群号手动搜索。',
      'QQ 交流群二维码': 'QQ 交流群二维码',
      复制成功: '复制成功',
    },
  },
  'zh-TW': {
    translation: {
      联系我们: '聯繫我們',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        '我們的團隊隨時為您提供支援，協助解決使用過程中的問題。',
      支持渠道: '支援渠道',
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        '帳戶、方案、接入或使用問題，都可以透過這些渠道直接聯繫團隊。',
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        '建議先透過郵件描述問題並附上帳戶資訊，複雜問題會更快定位。',
      直达支持: '直接支援',
      邮件支持: '郵件支援',
      '发送邮件联系我们，通常在24小时内回复':
        '寄送郵件聯繫我們，通常會在 24 小時內回覆。',
      邮箱地址: '郵箱地址',
      复制邮箱: '複製郵箱',
      发送邮件: '寄送郵件',
      'QQ 交流群': 'QQ 交流群',
      '加入用户交流群，获取最新资讯':
        '加入使用者交流群，取得最新資訊與社群協助。',
      群号: '群號',
      复制群号: '複製群號',
      查看二维码: '查看 QR Code',
      一键加群: '一鍵加群',
      '扫码加入 QQ 交流群': '掃碼加入 QQ 交流群',
      '扫码加入群聊，或复制群号手动搜索。':
        '掃描 QR Code 加入群聊，或複製群號手動搜尋。',
      'QQ 交流群二维码': 'QQ 交流群 QR Code',
      复制成功: '複製成功',
    },
  },
  fr: {
    translation: {
      联系我们: 'Contactez-nous',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        "Notre équipe est prête à vous aider pour toute question liée à l'utilisation du service.",
      支持渠道: "Canaux d'assistance",
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        "Pour les questions de compte, d'offre, d'intégration ou d'utilisation, contactez l'équipe via ces canaux.",
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        'Pour les problèmes complexes, envoyez une description par e-mail avec les informations du compte afin de localiser plus vite le problème.',
      直达支持: 'Assistance directe',
      邮件支持: 'Assistance par e-mail',
      '发送邮件联系我们，通常在24小时内回复':
        'Envoyez-nous un e-mail ; nous répondons généralement sous 24 heures.',
      邮箱地址: 'Adresse e-mail',
      复制邮箱: "Copier l'e-mail",
      发送邮件: 'Envoyer un e-mail',
      'QQ 交流群': 'Groupe QQ',
      '加入用户交流群，获取最新资讯':
        "Rejoignez le groupe d'utilisateurs pour les mises à jour et l'aide communautaire.",
      群号: 'ID du groupe',
      复制群号: "Copier l'ID du groupe",
      查看二维码: 'Voir le QR code',
      一键加群: 'Rejoindre',
      '扫码加入 QQ 交流群': 'Scannez pour rejoindre le groupe QQ',
      '扫码加入群聊，或复制群号手动搜索。':
        "Scannez pour rejoindre le groupe, ou copiez l'ID et recherchez-le manuellement.",
      'QQ 交流群二维码': 'QR code du groupe QQ',
      复制成功: 'Copié',
    },
  },
  ja: {
    translation: {
      联系我们: 'お問い合わせ',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        'ご利用中の問題について、チームがいつでもサポートします。',
      支持渠道: 'サポートチャンネル',
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        'アカウント、プラン、導入、利用に関する質問は、これらの窓口からチームへ直接お問い合わせください。',
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        '複雑な問題は、アカウント情報を添えてメールで状況を共有すると、より早く確認できます。',
      直达支持: '直接サポート',
      邮件支持: 'メールサポート',
      '发送邮件联系我们，通常在24小时内回复':
        'メールでお問い合わせください。通常24時間以内に返信します。',
      邮箱地址: 'メールアドレス',
      复制邮箱: 'メールをコピー',
      发送邮件: 'メールを送信',
      'QQ 交流群': 'QQグループ',
      '加入用户交流群，获取最新资讯':
        'ユーザーグループに参加して、最新情報とコミュニティサポートを受けられます。',
      群号: 'グループID',
      复制群号: 'グループIDをコピー',
      查看二维码: 'QRコードを表示',
      一键加群: '参加する',
      '扫码加入 QQ 交流群': 'スキャンしてQQグループに参加',
      '扫码加入群聊，或复制群号手动搜索。':
        'QRコードをスキャンするか、グループIDをコピーして手動で検索できます。',
      'QQ 交流群二维码': 'QQグループQRコード',
      复制成功: 'コピーしました',
    },
  },
  ru: {
    translation: {
      联系我们: 'Свяжитесь с нами',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        'Наша команда поможет с вопросами, которые возникают при использовании сервиса.',
      支持渠道: 'Каналы поддержки',
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        'По вопросам аккаунта, тарифов, интеграции или использования свяжитесь с командой через эти каналы.',
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        'Для сложных вопросов лучше написать по почте и приложить данные аккаунта, чтобы мы быстрее нашли проблему.',
      直达支持: 'Прямая поддержка',
      邮件支持: 'Поддержка по электронной почте',
      '发送邮件联系我们，通常在24小时内回复':
        'Напишите нам по электронной почте; обычно мы отвечаем в течение 24 часов.',
      邮箱地址: 'Адрес электронной почты',
      复制邮箱: 'Скопировать e-mail',
      发送邮件: 'Написать письмо',
      'QQ 交流群': 'Группа QQ',
      '加入用户交流群，获取最新资讯':
        'Присоединяйтесь к группе пользователей для новостей и помощи сообщества.',
      群号: 'ID группы',
      复制群号: 'Скопировать ID группы',
      查看二维码: 'Показать QR-код',
      一键加群: 'Присоединиться',
      '扫码加入 QQ 交流群': 'Сканируйте, чтобы вступить в группу QQ',
      '扫码加入群聊，或复制群号手动搜索。':
        'Отсканируйте код, чтобы вступить в группу, или скопируйте ID и найдите ее вручную.',
      'QQ 交流群二维码': 'QR-код группы QQ',
      复制成功: 'Скопировано',
    },
  },
  vi: {
    translation: {
      联系我们: 'Liên hệ chúng tôi',
      '我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题':
        'Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ các vấn đề bạn gặp khi sử dụng dịch vụ.',
      支持渠道: 'Kênh hỗ trợ',
      '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。':
        'Với câu hỏi về tài khoản, gói dịch vụ, tích hợp hoặc sử dụng, hãy liên hệ đội ngũ qua các kênh này.',
      '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。':
        'Với vấn đề phức tạp, hãy gửi email kèm mô tả và thông tin tài khoản để chúng tôi xử lý nhanh hơn.',
      直达支持: 'Hỗ trợ trực tiếp',
      邮件支持: 'Hỗ trợ qua email',
      '发送邮件联系我们，通常在24小时内回复':
        'Gửi email cho chúng tôi; thông thường chúng tôi phản hồi trong vòng 24 giờ.',
      邮箱地址: 'Địa chỉ email',
      复制邮箱: 'Sao chép email',
      发送邮件: 'Gửi email',
      'QQ 交流群': 'Nhóm QQ',
      '加入用户交流群，获取最新资讯':
        'Tham gia nhóm người dùng để nhận cập nhật và hỗ trợ cộng đồng.',
      群号: 'ID nhóm',
      复制群号: 'Sao chép ID nhóm',
      查看二维码: 'Xem mã QR',
      一键加群: 'Tham gia ngay',
      '扫码加入 QQ 交流群': 'Quét để tham gia nhóm QQ',
      '扫码加入群聊，或复制群号手动搜索。':
        'Quét để tham gia nhóm, hoặc sao chép ID nhóm và tìm thủ công.',
      'QQ 交流群二维码': 'Mã QR nhóm QQ',
      复制成功: 'Đã sao chép',
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
