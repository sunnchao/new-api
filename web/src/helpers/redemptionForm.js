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

import { REDEMPTION_TYPES } from '../constants/redemption.constants.js';

const DEFAULT_QUOTA = 100000;

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toDisplayAmount = (quota, quotaToDisplayAmount) => {
  const amount = toNumber(quotaToDisplayAmount(toNumber(quota)));
  return Number(amount.toFixed(6));
};

const normalizeRedemptionType = (type) => {
  return type === REDEMPTION_TYPES.SUBSCRIPTION
    ? REDEMPTION_TYPES.SUBSCRIPTION
    : REDEMPTION_TYPES.QUOTA;
};

const toExpiredTimestamp = (value) => {
  if (!value) return 0;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
};

export const getDefaultRedemptionFormValues = ({
  quotaToDisplayAmount = (quota) => quota,
} = {}) => ({
  name: '',
  type: REDEMPTION_TYPES.QUOTA,
  quota: DEFAULT_QUOTA,
  amount: toDisplayAmount(DEFAULT_QUOTA, quotaToDisplayAmount),
  count: 1,
  subscription_plan_id: undefined,
  expired_time: null,
});

export const getRedemptionFormValues = (
  redemption = {},
  { quotaToDisplayAmount = (quota) => quota } = {},
) => {
  const type = normalizeRedemptionType(redemption.type);
  const quota =
    type === REDEMPTION_TYPES.SUBSCRIPTION ? 0 : toNumber(redemption.quota);
  const subscriptionPlanId = parseInt(redemption.subscription_plan_id, 10);

  return {
    ...getDefaultRedemptionFormValues({ quotaToDisplayAmount }),
    ...redemption,
    type,
    quota,
    amount:
      type === REDEMPTION_TYPES.SUBSCRIPTION
        ? 0
        : toDisplayAmount(quota, quotaToDisplayAmount),
    count: 1,
    subscription_plan_id:
      type === REDEMPTION_TYPES.SUBSCRIPTION && subscriptionPlanId > 0
        ? subscriptionPlanId
        : undefined,
    expired_time:
      redemption.expired_time > 0
        ? new Date(redemption.expired_time * 1000)
        : null,
  };
};

export const buildRedemptionPayload = (
  values,
  { displayAmountToQuota = (amount) => amount } = {},
) => {
  const type = normalizeRedemptionType(values.type);
  const count = parseInt(values.count, 10) || 1;

  if (type === REDEMPTION_TYPES.SUBSCRIPTION) {
    return {
      name: values.name,
      type,
      quota: 0,
      subscription_plan_id: parseInt(values.subscription_plan_id, 10) || 0,
      count,
      expired_time: toExpiredTimestamp(values.expired_time),
    };
  }

  return {
    name: values.name,
    type,
    quota: displayAmountToQuota(values.amount),
    subscription_plan_id: 0,
    count,
    expired_time: toExpiredTimestamp(values.expired_time),
  };
};
