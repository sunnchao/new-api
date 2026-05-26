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

export const SUBSCRIPTION_CHECKOUT_PARAM = 'subscribe_plan';

export function buildSubscriptionCheckoutPath(planId) {
  const params = new URLSearchParams();
  if (planId !== undefined && planId !== null && `${planId}` !== '') {
    params.set(SUBSCRIPTION_CHECKOUT_PARAM, `${planId}`);
  }

  const query = params.toString();
  return `/console/subscriptions${query ? `?${query}` : ''}`;
}

export function buildSubscriptionLoginState(planId) {
  const checkoutPath = buildSubscriptionCheckoutPath(planId);
  const [pathname, search = ''] = checkoutPath.split('?');

  return {
    from: {
      pathname,
      search: search ? `?${search}` : '',
      hash: '',
    },
  };
}

export function findSubscriptionPlanRecord(plans = [], planId) {
  if (planId === undefined || planId === null || `${planId}` === '') {
    return null;
  }

  const normalizedPlanId = `${planId}`;
  return (
    (plans || []).find((item) => `${item?.plan?.id}` === normalizedPlanId) ||
    null
  );
}
