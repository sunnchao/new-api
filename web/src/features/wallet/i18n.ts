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
      'Purchase a plan to enjoy model benefits':
        'Purchase a plan to enjoy model benefits',
      'Successfully redeemed subscription: {{plan}}':
        'Successfully redeemed subscription: {{plan}}',
    },
  },
  zh: {
    translation: {
      'Purchase a plan to enjoy model benefits': '购买套餐后即可享受模型权益',
      'Successfully redeemed subscription: {{plan}}': '订阅兑换成功：{{plan}}',
    },
  },
  fr: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Souscrivez un plan pour bénéficier des avantages des modèles',
      'Successfully redeemed subscription: {{plan}}':
        'Abonnement utilisé avec succès : {{plan}}',
    },
  },
  ja: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'プランを購入してモデルの特典を享受',
      'Successfully redeemed subscription: {{plan}}':
        'サブスクリプションを交換しました: {{plan}}',
    },
  },
  ru: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Приобретите план, чтобы воспользоваться преимуществами моделей',
      'Successfully redeemed subscription: {{plan}}':
        'Подписка успешно активирована: {{plan}}',
    },
  },
  vi: {
    translation: {
      'Purchase a plan to enjoy model benefits':
        'Mua gói để tận hưởng quyền lợi mô hình',
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
