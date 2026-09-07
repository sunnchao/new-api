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
import { beforeAll, describe, expect, test } from 'vitest'
import i18n from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { initReactI18next } from 'react-i18next'

import { ModelCard } from '../components/model-card'
import { QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel } from '../types'

beforeAll(async () => {
  if (i18n.isInitialized) {
    i18n.addResourceBundle(
      'en',
      'translation',
      {
        'per request': 'per request',
        'per image': 'per image',
        '{{count}} specs': '{{count}} specs',
      },
      true,
      true
    )
    return
  }

  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          'per request': 'per request',
          'per image': 'per image',
          '{{count}} specs': '{{count}} specs',
        },
      },
    },
    interpolation: { escapeValue: false },
  })
})

function imageSpecModel(): PricingModel {
  return {
    id: 1,
    model_name: 'grok-imagine-image-2.0',
    quota_type: QUOTA_TYPE_VALUES.REQUEST,
    model_ratio: 1,
    completion_ratio: 1,
    model_price: 0.02,
    enable_groups: ['default'],
    image_spec_price: {
      '1k/high': 0.08,
      '2k': 0.06,
      '2k/high': 0.1,
    },
  }
}

describe('model card image spec prices', () => {
  test('shows fallback and first spec, then a remaining spec count', () => {
    const html = renderToStaticMarkup(
      <ModelCard model={imageSpecModel()} onClick={() => undefined} />
    )

    expect(html).toContain('per request')
    expect(html).toContain('per image')
    expect(html).toContain('2 specs')
    expect(html).not.toContain('2k/high')
  })
})
