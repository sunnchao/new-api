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
      'Successfully redeemed subscription: {{plan}}':
        'Successfully redeemed subscription: {{plan}}',
    },
  },
  zh: {
    translation: {
      'Successfully redeemed subscription: {{plan}}': '订阅兑换成功：{{plan}}',
    },
  },
  fr: {
    translation: {
      'Successfully redeemed subscription: {{plan}}':
        'Abonnement utilisé avec succès : {{plan}}',
    },
  },
  ja: {
    translation: {
      'Successfully redeemed subscription: {{plan}}':
        'サブスクリプションを交換しました: {{plan}}',
    },
  },
  ru: {
    translation: {
      'Successfully redeemed subscription: {{plan}}':
        'Подписка успешно активирована: {{plan}}',
    },
  },
  vi: {
    translation: {
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
