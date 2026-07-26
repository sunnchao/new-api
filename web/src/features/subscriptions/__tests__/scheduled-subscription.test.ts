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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  ADMIN_SUBSCRIPTION_STATUS_FILTERS,
  SUBSCRIPTION_STATUS_LABEL_KEYS,
} from '../constants'
import { subscriptionsI18nResources } from '../i18n'
import { subscriptionStatusSchema } from '../types'

const SCHEDULED_RENEWAL_CONFIRMATION =
  'This will create a new scheduled subscription for one original plan period. The current active subscription will continue unchanged. Continue?'

describe('scheduled subscription status', () => {
  test('accepts supported statuses and rejects unknown values', () => {
    for (const status of [
      'active',
      'scheduled',
      'expired',
      'cancelled',
      'exhausted',
    ]) {
      assert.equal(subscriptionStatusSchema.parse(status), status)
    }

    assert.throws(() => subscriptionStatusSchema.parse('pending'))
  })

  test('exposes scheduled subscriptions in the admin pending filter', () => {
    assert.equal(SUBSCRIPTION_STATUS_LABEL_KEYS.scheduled, 'Pending')
    assert.equal(
      ADMIN_SUBSCRIPTION_STATUS_FILTERS.some(
        (option) => option.value === 'scheduled'
      ),
      true
    )
  })

  test('translates the scheduled renewal confirmation in every locale', () => {
    for (const resource of Object.values(subscriptionsI18nResources)) {
      assert.equal(
        Object.hasOwn(resource.translation, SCHEDULED_RENEWAL_CONFIRMATION),
        true
      )
    }
  })
})
