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
      'Choose what users receive after redeeming this code':
        'Choose what users receive after redeeming this code',
      'Redemption content': 'Redemption content',
      'Select content type': 'Select content type',
      'Subscription plan': 'Subscription plan',
      'Subscription plan #{{id}}': 'Subscription plan #{{id}}',
      'The selected plan will be granted directly':
        'The selected plan will be granted directly',
    },
  },
  zh: {
    translation: {
      'Choose what users receive after redeeming this code':
        '选择用户兑换此兑换码后获得的内容',
      'Redemption content': '兑换内容',
      'Select content type': '选择内容类型',
      'Subscription plan': '订阅套餐',
      'Subscription plan #{{id}}': '订阅套餐 #{{id}}',
      'The selected plan will be granted directly':
        '所选套餐将直接发放给兑换用户',
    },
  },
  fr: {
    translation: {
      'Choose what users receive after redeeming this code':
        'Choisissez ce que les utilisateurs reçoivent après avoir utilisé ce code',
      'Redemption content': "Contenu de l'échange",
      'Select content type': 'Sélectionner le type de contenu',
      'Subscription plan': "Plan d'abonnement",
      'Subscription plan #{{id}}': "Plan d'abonnement n° {{id}}",
      'The selected plan will be granted directly':
        'Le plan sélectionné sera attribué directement',
    },
  },
  ja: {
    translation: {
      'Choose what users receive after redeeming this code':
        'このコードを交換したユーザーが受け取る内容を選択します',
      'Redemption content': '交換内容',
      'Select content type': '内容タイプを選択',
      'Subscription plan': 'サブスクリプションプラン',
      'Subscription plan #{{id}}': 'サブスクリプションプラン #{{id}}',
      'The selected plan will be granted directly':
        '選択したプランは直接付与されます',
    },
  },
  ru: {
    translation: {
      'Choose what users receive after redeeming this code':
        'Выберите, что пользователи получат после активации этого кода',
      'Redemption content': 'Содержимое активации',
      'Select content type': 'Выберите тип содержимого',
      'Subscription plan': 'План подписки',
      'Subscription plan #{{id}}': 'План подписки #{{id}}',
      'The selected plan will be granted directly':
        'Выбранный план будет выдан напрямую',
    },
  },
  vi: {
    translation: {
      'Choose what users receive after redeeming this code':
        'Chọn nội dung người dùng nhận được sau khi đổi mã này',
      'Redemption content': 'Nội dung đổi thưởng',
      'Select content type': 'Chọn loại nội dung',
      'Subscription plan': 'Gói đăng ký',
      'Subscription plan #{{id}}': 'Gói đăng ký #{{id}}',
      'The selected plan will be granted directly':
        'Gói đã chọn sẽ được cấp trực tiếp',
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
