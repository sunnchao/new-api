import i18n from '@/i18n/config'

const resources = {
  en: {
    translation: {
      'Contact us': 'Contact us',
      'Email support': 'Email support',
      'Reply within 24 hours.': 'Reply within 24 hours.',
      'QQ group': 'QQ group',
      'User updates and community help.': 'User updates and community help.',
      'View QR code': 'View QR code',
      'Copy contact': 'Copy contact',
      'Copied!': 'Copied!',
      'Quick join': 'Quick join',
      'QQ group QR code': 'QQ group QR code',
      'Scan to join the QQ group': 'Scan to join the QQ group',
      'Scan the QR code to join the QQ group.':
        'Scan the QR code to join the QQ group.',
      'Scan to join the group, or copy the group ID and search manually.':
        'Scan to join the group, or copy the group ID and search manually.',
      'Group ID': 'Group ID',
    },
  },
  zh: {
    translation: {
      'Contact us': '联系我们',
      'Email support': '邮件支持',
      'Reply within 24 hours.': '24 小时内回复。',
      'QQ group': 'QQ 群',
      'User updates and community help.': '用户更新与社区互助。',
      'View QR code': '查看二维码',
      'Copy contact': '复制联系方式',
      'Copied!': '已复制！',
      'Quick join': '一键加群',
      'QQ group QR code': 'QQ 群二维码',
      'Scan to join the QQ group': '扫码加入 QQ 群',
      'Scan the QR code to join the QQ group.': '扫描二维码加入 QQ 群。',
      'Scan to join the group, or copy the group ID and search manually.':
        '扫码加入群聊，或复制群号手动搜索。',
      'Group ID': '群号',
    },
  },
  fr: {
    translation: {
      'Contact us': 'Contactez-nous',
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
      'Scan to join the QQ group': 'Scannez pour rejoindre le groupe QQ',
      'Scan the QR code to join the QQ group.':
        'Scannez le QR code pour rejoindre le groupe QQ.',
      'Scan to join the group, or copy the group ID and search manually.':
        "Scannez pour rejoindre le groupe, ou copiez l'ID et recherchez-le manuellement.",
      'Group ID': 'ID du groupe',
    },
  },
  ja: {
    translation: {
      'Contact us': 'お問い合わせ',
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
      'Scan to join the QQ group': 'スキャンしてQQグループに参加',
      'Scan the QR code to join the QQ group.':
        'QRコードをスキャンしてQQグループに参加。',
      'Scan to join the group, or copy the group ID and search manually.':
        'QRコードをスキャンするか、グループIDをコピーして手動で検索できます。',
      'Group ID': 'グループID',
    },
  },
  ru: {
    translation: {
      'Contact us': 'Свяжитесь с нами',
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
      'Scan to join the QQ group': 'Сканируйте, чтобы вступить в группу QQ',
      'Scan the QR code to join the QQ group.':
        'Отсканируйте QR-код, чтобы присоединиться к группе QQ.',
      'Scan to join the group, or copy the group ID and search manually.':
        'Отсканируйте код, чтобы вступить в группу, или скопируйте ID и найдите ее вручную.',
      'Group ID': 'ID группы',
    },
  },
  vi: {
    translation: {
      'Contact us': 'Liên hệ với chúng tôi',
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
      'Scan to join the QQ group': 'Quét để tham gia nhóm QQ',
      'Scan the QR code to join the QQ group.':
        'Quét mã QR để tham gia nhóm QQ.',
      'Scan to join the group, or copy the group ID and search manually.':
        'Quét để tham gia nhóm, hoặc sao chép ID nhóm và tìm thủ công.',
      'Group ID': 'ID nhóm',
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
