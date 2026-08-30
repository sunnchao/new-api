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
      'Admin Assigned': 'Admin Assigned',
      'Gift quota {{quota}}': 'Gift quota {{quota}}',
      'Purchase a plan to enjoy model benefits':
        'Purchase a plan to enjoy model benefits',
      'Self Purchased': 'Self Purchased',
      'Successfully redeemed subscription: {{plan}}':
        'Successfully redeemed subscription: {{plan}}',
    },
  },
  zh: {
    translation: {
      'Admin Assigned': '管理员分配',
      'Gift quota {{quota}}': '赠送额度 {{quota}}',
      'Purchase a plan to enjoy model benefits': '购买套餐后即可享受模型权益',
      'Self Purchased': '自行购买',
      'Successfully redeemed subscription: {{plan}}': '订阅兑换成功：{{plan}}',
    },
  },
  zhCN: {
    translation: {
      'Admin Assigned': '管理员分配',
      'Gift quota {{quota}}': '赠送额度 {{quota}}',
      'Self Purchased': '自行购买',
    },
  },
  zhTW: {
    translation: {
      'Admin Assigned': '管理員分配',
      'Gift quota {{quota}}': '贈送額度 {{quota}}',
      'Self Purchased': '自行購買',
    },
  },
  fr: {
    translation: {
      'Admin Assigned': "Attribué par l'administrateur",
      'Gift quota {{quota}}': 'Quota offert : {{quota}}',
      'Purchase a plan to enjoy model benefits':
        'Souscrivez un plan pour bénéficier des avantages des modèles',
      'Self Purchased': 'Acheté par vous-même',
      'Successfully redeemed subscription: {{plan}}':
        'Abonnement utilisé avec succès : {{plan}}',
    },
  },
  ja: {
    translation: {
      'Admin Assigned': '管理者割り当て',
      'Gift quota {{quota}}': '特典クォータ {{quota}}',
      'Purchase a plan to enjoy model benefits':
        'プランを購入してモデルの特典を享受',
      'Self Purchased': '自己購入',
      'Successfully redeemed subscription: {{plan}}':
        'サブスクリプションを交換しました: {{plan}}',
    },
  },
  ru: {
    translation: {
      'Admin Assigned': 'Назначено администратором',
      'Gift quota {{quota}}': 'Подарочная квота: {{quota}}',
      'Purchase a plan to enjoy model benefits':
        'Приобретите план, чтобы воспользоваться преимуществами моделей',
      'Self Purchased': 'Куплено самостоятельно',
      'Successfully redeemed subscription: {{plan}}':
        'Подписка успешно активирована: {{plan}}',
    },
  },
  vi: {
    translation: {
      'Admin Assigned': 'Quản trị viên chỉ định',
      'Gift quota {{quota}}': 'Hạn mức tặng {{quota}}',
      'Purchase a plan to enjoy model benefits':
        'Mua gói để tận hưởng quyền lợi mô hình',
      'Self Purchased': 'Tự mua',
      'Successfully redeemed subscription: {{plan}}':
        'Đổi gói đăng ký thành công: {{plan}}',
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
