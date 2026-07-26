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

import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import { UserContext } from '../../context/User';
import { normalizeTopupPaymentConfig } from '../../helpers/topupPayment';

const DEFAULT_BILLING_PREFERENCE = 'subscription_first';

const useSubscriptionCenterData = () => {
  const { t } = useTranslation();
  const [, userDispatch] = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [payMethods, setPayMethods] = useState([]);
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [enableStripeTopUp, setEnableStripeTopUp] = useState(false);
  const [enableCreemTopUp, setEnableCreemTopUp] = useState(false);
  const [billingPreference, setBillingPreference] = useState(
    DEFAULT_BILLING_PREFERENCE,
  );
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  const loadPlans = useCallback(async () => {
    const res = await API.get('/api/subscription/plans');
    if (!res.data?.success) {
      throw new Error(res.data?.message || t('加载订阅方案失败'));
    }
    setPlans(res.data.data || []);
  }, [t]);

  const reloadSubscriptionSelf = useCallback(async () => {
    const res = await API.get('/api/subscription/self');
    if (!res.data?.success) {
      throw new Error(res.data?.message || t('加载订阅信息失败'));
    }

    const data = res.data.data || {};
    setBillingPreference(
      data.billing_preference || DEFAULT_BILLING_PREFERENCE,
    );
    setActiveSubscriptions(data.subscriptions || []);
    setAllSubscriptions(data.all_subscriptions || []);
    return data;
  }, [t]);

  const loadPaymentConfig = useCallback(async () => {
    const res = await API.get('/api/user/topup/info');
    if (!res.data?.success) {
      throw new Error(res.data?.message || t('加载支付方式失败'));
    }

    const normalized = normalizeTopupPaymentConfig(res.data.data || {});
    setPayMethods(normalized.payMethods);
    setEnableOnlineTopUp(normalized.enableOnlineTopUp);
    setEnableStripeTopUp(normalized.enableStripeTopUp);
    setEnableCreemTopUp(normalized.enableCreemTopUp);
    return normalized;
  }, [t]);

  const reloadUserQuota = useCallback(async () => {
    const res = await API.get('/api/user/self');
    const { success, message, data } = res.data;

    if (!success) {
      throw new Error(message || t('获取用户信息失败'));
    }

    userDispatch({ type: 'login', payload: data });
    return data;
  }, [t, userDispatch]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await Promise.all([
        loadPlans(),
        reloadSubscriptionSelf(),
        loadPaymentConfig(),
      ]);
    } catch (e) {
      setError(e.message || t('加载订阅信息失败'));
    } finally {
      setLoading(false);
    }
  }, [loadPaymentConfig, loadPlans, reloadSubscriptionSelf, t]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const updateBillingPreference = useCallback(
    async (pref) => {
      const previousPref = billingPreference;
      setBillingPreference(pref);

      try {
        const res = await API.put('/api/subscription/self/preference', {
          billing_preference: pref,
        });

        if (!res.data?.success) {
          throw new Error(res.data?.message || t('更新失败'));
        }

        const nextPref =
          res.data?.data?.billing_preference || pref || previousPref;
        setBillingPreference(nextPref);
        showSuccess(t('更新成功'));
        return nextPref;
      } catch (e) {
        setBillingPreference(previousPref);
        showError(e.message || t('更新失败'));
        return previousPref;
      }
    },
    [billingPreference, t],
  );

  return {
    loading,
    error,
    plans,
    payMethods,
    enableOnlineTopUp,
    enableStripeTopUp,
    enableCreemTopUp,
    billingPreference,
    activeSubscriptions,
    allSubscriptions,
    reloadAll,
    reloadSubscriptionSelf,
    reloadUserQuota,
    updateBillingPreference,
  };
};

export default useSubscriptionCenterData;
