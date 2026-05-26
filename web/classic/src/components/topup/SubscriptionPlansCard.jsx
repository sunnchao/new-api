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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Divider,
  Progress,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { API, showError, showSuccess, renderQuota } from '../../helpers';
import { RefreshCw } from 'lucide-react';
import SubscriptionPurchaseModal from './modals/SubscriptionPurchaseModal';
import SubscriptionQuotaLimitSummary from './SubscriptionQuotaLimitSummary';
import {
  getSubscriptionUsageMetrics,
  getSubscriptionQuotaLimitTitle,
  getSubscriptionTotalLabel,
} from '../../helpers/subscriptionFormat';
import { PublicSubscriptionPlanCard } from '../subscriptions/PublicSubscriptionPlanCard';
import { parseAllowedGroups } from '../subscriptions/publicPlanModels';
import { findSubscriptionPlanRecord } from '../../helpers/subscriptionRouting';

const { Text } = Typography;

// 过滤易支付方式
function getEpayMethods(payMethods = []) {
  return (payMethods || []).filter(
    (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem',
  );
}

// 提交易支付表单
function submitEpayForm({ url, params }) {
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari =
    navigator.userAgent.indexOf('Safari') > -1 &&
    navigator.userAgent.indexOf('Chrome') < 1;
  if (!isSafari) form.target = '_blank';
  Object.keys(params || {}).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

const SubscriptionPlansCard = ({
  t,
  loading = false,
  plans = [],
  payMethods = [],
  enableOnlineTopUp = false,
  enableStripeTopUp = false,
  enableCreemTopUp = false,
  billingPreference,
  onChangeBillingPreference,
  activeSubscriptions = [],
  allSubscriptions = [],
  reloadSubscriptionSelf,
  reloadUserQuota,
  withCard = true,
  autoOpenPlanId = '',
  onAutoOpenConsumed,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paying, setPaying] = useState(false);
  const [selectedEpayMethod, setSelectedEpayMethod] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const consumedAutoOpenPlanIdRef = useRef('');

  const epayMethods = useMemo(() => getEpayMethods(payMethods), [payMethods]);

  const openBuy = (p) => {
    setSelectedPlan(p);
    setSelectedEpayMethod(epayMethods?.[0]?.type || '');
    setOpen(true);
  };

  useEffect(() => {
    if (loading || !autoOpenPlanId) {
      return;
    }

    if (consumedAutoOpenPlanIdRef.current === `${autoOpenPlanId}`) {
      return;
    }

    const matchedPlan = findSubscriptionPlanRecord(plans, autoOpenPlanId);
    if (!matchedPlan) {
      return;
    }

    consumedAutoOpenPlanIdRef.current = `${autoOpenPlanId}`;
    setSelectedPlan(matchedPlan);
    setSelectedEpayMethod(epayMethods?.[0]?.type || '');
    setOpen(true);
    onAutoOpenConsumed?.();
  }, [autoOpenPlanId, epayMethods, loading, onAutoOpenConsumed, plans]);

  const closeBuy = () => {
    setOpen(false);
    setSelectedPlan(null);
    setPaying(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadSubscriptionSelf?.();
    } finally {
      setRefreshing(false);
    }
  };

  const payStripe = async () => {
    if (!selectedPlan?.plan?.stripe_price_id) {
      showError(t('该套餐未配置 Stripe'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/stripe/pay', {
        plan_id: selectedPlan.plan.id,
      });
      if (res.data?.message === 'success') {
        window.open(res.data.data?.pay_link, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payBalance = async () => {
    if (!selectedPlan?.plan?.id) {
      showError(t('请选择套餐'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/balance/pay', {
        plan_id: selectedPlan.plan.id,
      });
      const ok = res.data?.message === 'success' || res.data?.success === true;
      if (ok) {
        showSuccess(t('购买成功'));
        closeBuy();
        await reloadSubscriptionSelf?.();
        await reloadUserQuota?.();
      } else {
        showError(res.data?.data || res.data?.message || t('购买失败'));
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payCreem = async () => {
    if (!selectedPlan?.plan?.creem_product_id) {
      showError(t('该套餐未配置 Creem'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/creem/pay', {
        plan_id: selectedPlan.plan.id,
      });
      if (res.data?.message === 'success') {
        window.open(res.data.data?.checkout_url, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payEpay = async () => {
    if (!selectedEpayMethod) {
      showError(t('请选择支付方式'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/epay/pay', {
        plan_id: selectedPlan.plan.id,
        payment_method: selectedEpayMethod,
      });
      if (res.data?.message === 'success') {
        submitEpayForm({ url: res.data.url, params: res.data.data });
        showSuccess(t('已发起支付'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  // 当前订阅信息 - 支持多个订阅
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const hasAnySubscription = allSubscriptions.length > 0;
  const disableSubscriptionPreference = !hasActiveSubscription;
  const isSubscriptionPreference =
    billingPreference === 'subscription_first' ||
    billingPreference === 'subscription_only';
  const displayBillingPreference =
    disableSubscriptionPreference && isSubscriptionPreference
      ? 'wallet_first'
      : billingPreference;
  const subscriptionPreferenceLabel =
    billingPreference === 'subscription_only' ? t('仅用订阅') : t('优先订阅');

  const planPurchaseCountMap = useMemo(() => {
    const map = new Map();
    (allSubscriptions || []).forEach((sub) => {
      const planId = sub?.subscription?.plan_id;
      if (!planId) return;
      map.set(planId, (map.get(planId) || 0) + 1);
    });
    return map;
  }, [allSubscriptions]);

  const planTitleMap = useMemo(() => {
    const map = new Map();
    (plans || []).forEach((p) => {
      const plan = p?.plan;
      if (!plan?.id) return;
      map.set(plan.id, plan.title || '');
    });
    return map;
  }, [plans]);

  const getPlanPurchaseCount = (planId) =>
    planPurchaseCountMap.get(planId) || 0;

  const getRemainingDays = (sub) => {
    if (!sub?.subscription?.end_time) return 0;
    const now = Date.now() / 1000;
    const remaining = sub.subscription.end_time - now;
    return Math.max(0, Math.ceil(remaining / 86400));
  };

  const renderSubscriptionCard = (sub, subIndex) => {
    const subscription = sub?.subscription || {};
    const totalAmount = Number(subscription?.amount_total || 0);
    const usedAmount = Number(subscription?.amount_used || 0);
    const planTitle = planTitleMap.get(subscription?.plan_id) || '';
    const allowedGroups = parseAllowedGroups(subscription?.allowed_groups);
    const remainDays = getRemainingDays(sub);
    const now = Date.now() / 1000;
    const isExpired = (subscription?.end_time || 0) < now;
    const isCancelled = subscription?.status === 'cancelled';
    const isActive = subscription?.status === 'active' && !isExpired;
    const usageMetrics = getSubscriptionUsageMetrics(
      {
        used: usedAmount,
        total: totalAmount,
      },
      subscription,
      t,
      renderQuota,
    );
    const totalLabel = getSubscriptionTotalLabel(subscription, t);
    const statusTag = isActive ? (
      <Tag
        color='green'
        size='small'
        shape='circle'
        prefixIcon={<Badge dot type='success' />}
      >
        {t('生效')}
      </Tag>
    ) : isCancelled ? (
      <Tag color='grey' size='small' shape='circle'>
        {t('已作废')}
      </Tag>
    ) : (
      <Tag color='orange' size='small' shape='circle'>
        {t('已过期')}
      </Tag>
    );
    const endTimeLabel = isActive
      ? t('至')
      : isCancelled
        ? t('作废于')
        : t('过期于');

    return (
      <Card
        key={subscription?.id || subIndex}
        className='!rounded-xl w-full border border-semi-color-border'
        bodyStyle={{ padding: 16 }}
      >
        <div className='flex flex-col gap-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <Text
                strong
                ellipsis={{ rows: 1, showTooltip: true }}
                className='block'
              >
                {planTitle
                  ? `${planTitle} · ${t('订阅')} #${subscription?.id}`
                  : `${t('订阅')} #${subscription?.id}`}
              </Text>
              <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500'>
                {statusTag}
                {isActive && (
                  <span>
                    {t('剩余')} {remainDays} {t('天')}
                  </span>
                )}
              </div>
            </div>
            <Tag size='small' color='blue' shape='circle'>
              {totalLabel}
            </Tag>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div className='rounded-lg bg-gray-50/80 px-3 py-2'>
              <Text type='tertiary' size='small'>
                {t('已用')}
              </Text>
              <Text strong className='block mt-1 break-words'>
                {usageMetrics.usedText}
              </Text>
            </div>
            <div className='rounded-lg bg-gray-50/80 px-3 py-2'>
              <Text type='tertiary' size='small'>
                {totalLabel}
              </Text>
              <Text strong className='block mt-1 break-words'>
                {usageMetrics.isUnlimited ? t('不限') : usageMetrics.totalText}
              </Text>
            </div>
            <div className='rounded-lg bg-gray-50/80 px-3 py-2'>
              <Text type='tertiary' size='small'>
                {t('剩余')}
              </Text>
              <Text strong className='block mt-1 break-words'>
                {usageMetrics.isUnlimited ? t('不限') : usageMetrics.remainText}
              </Text>
            </div>
          </div>

          <div>
            <div className='mb-2 flex items-center justify-between gap-3 text-xs text-gray-500'>
              <span>{t('使用情况')}</span>
              <span>
                {usageMetrics.isUnlimited
                  ? t('不限')
                  : `${usageMetrics.percent}%`}
              </span>
            </div>
            <Progress
              percent={usageMetrics.percent}
              showInfo={false}
              stroke={isActive ? 'var(--semi-color-primary)' : undefined}
              aria-label={t('使用情况')}
            />
            {!usageMetrics.isUnlimited && (
              <div className='mt-2 text-xs text-gray-500 break-words'>
                {t('已用')} {usageMetrics.usedText} /{' '}
                {usageMetrics.totalText} · {t('剩余')}{' '}
                {usageMetrics.remainText}
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500'>
            <div>
              {endTimeLabel}:{' '}
              {subscription?.end_time
                ? new Date(subscription.end_time * 1000).toLocaleString()
                : '-'}
            </div>
            {isActive && subscription?.next_reset_time > 0 && (
              <div>
                {t('下一次重置')}:{' '}
                {new Date(subscription.next_reset_time * 1000).toLocaleString()}
              </div>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500'>
            <span>{t('允许分组')}:</span>
            {allowedGroups.length > 0 ? (
              allowedGroups.map((group) => (
                <Tag key={`${subscription?.id}-${group}`} size='small'>
                  {group}
                </Tag>
              ))
            ) : (
              <Tag size='small' color='white'>
                {t('所有分组')}
              </Tag>
            )}
          </div>

          <SubscriptionQuotaLimitSummary
            source={subscription}
            t={t}
            variant='subscription'
            title={`${t('当前')}${getSubscriptionQuotaLimitTitle(subscription, t)}`}
          />
        </div>
      </Card>
    );
  };

  const cardContent = (
    <>
      {/* 卡片头部 */}
      {loading ? (
        <div className='space-y-4'>
          {/* 我的订阅骨架屏 */}
          <Card className='!rounded-xl w-full' bodyStyle={{ padding: '12px' }}>
            <div className='flex items-center justify-between mb-3'>
              <Skeleton.Title active style={{ width: 100, height: 20 }} />
              <Skeleton.Button active style={{ width: 24, height: 24 }} />
            </div>
            <div className='space-y-2'>
              <Skeleton.Paragraph active rows={2} />
            </div>
          </Card>
          {/* 套餐列表骨架屏 */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full px-1'>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className='!rounded-xl w-full h-full'
                bodyStyle={{ padding: 16 }}
              >
                <Skeleton.Title
                  active
                  style={{ width: '60%', height: 24, marginBottom: 8 }}
                />
                <Skeleton.Paragraph
                  active
                  rows={1}
                  style={{ marginBottom: 12 }}
                />
                <div className='text-center py-4'>
                  <Skeleton.Title
                    active
                    style={{ width: '40%', height: 32, margin: '0 auto' }}
                  />
                </div>
                <Skeleton.Paragraph active rows={3} style={{ marginTop: 12 }} />
                <Skeleton.Button
                  active
                  block
                  style={{ marginTop: 16, height: 32 }}
                />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Space vertical style={{ width: '100%' }} spacing={8}>
          {/* 当前订阅状态 */}
          <Card className='!rounded-xl w-full' bodyStyle={{ padding: '12px' }}>
            <div className='flex items-center justify-between mb-2 gap-3'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <Text strong>{t('我的订阅')}</Text>
                {hasActiveSubscription ? (
                  <Tag
                    color='white'
                    size='small'
                    shape='circle'
                    prefixIcon={<Badge dot type='success' />}
                  >
                    {activeSubscriptions.length} {t('个生效中')}
                  </Tag>
                ) : (
                  <Tag color='white' size='small' shape='circle'>
                    {t('无生效')}
                  </Tag>
                )}
                {allSubscriptions.length > activeSubscriptions.length && (
                  <Tag color='white' size='small' shape='circle'>
                    {allSubscriptions.length - activeSubscriptions.length}{' '}
                    {t('个已过期')}
                  </Tag>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Select
                  value={displayBillingPreference}
                  onChange={onChangeBillingPreference}
                  optionList={[
                    {
                      value: 'subscription_first',
                      label: disableSubscriptionPreference
                        ? `${t('优先订阅')} (${t('无生效')})`
                        : t('优先订阅'),
                      disabled: disableSubscriptionPreference,
                    },
                    { value: 'wallet_first', label: t('优先钱包') },
                    {
                      value: 'subscription_only',
                      label: disableSubscriptionPreference
                        ? `${t('仅用订阅')} (${t('无生效')})`
                        : t('仅用订阅'),
                      disabled: disableSubscriptionPreference,
                    },
                    { value: 'wallet_only', label: t('仅用钱包') },
                  ]}
                />
                <Button
                  theme='light'
                  type='tertiary'
                  icon={
                    <RefreshCw
                      size={12}
                      className={refreshing ? 'animate-spin' : ''}
                    />
                  }
                  onClick={handleRefresh}
                  loading={refreshing}
                />
              </div>
            </div>
            {disableSubscriptionPreference && isSubscriptionPreference && (
              <Text type='tertiary' size='small'>
                {t('已保存偏好为')}
                {subscriptionPreferenceLabel}
                {t('，当前无生效订阅，将自动使用钱包')}
              </Text>
            )}

            {hasAnySubscription ? (
              <>
                <Divider margin={8} />
                <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1 semi-table-body'>
                  {allSubscriptions.map(renderSubscriptionCard)}
                </div>
              </>
            ) : (
              <div className='text-xs text-gray-500'>
                {t('购买套餐后即可享受模型权益')}
              </div>
            )}
          </Card>

          {/* 可购买套餐 - 复用公共订阅套餐卡片 */}
          {plans.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full'>
              {plans.map((p, index) => {
                const plan = p?.plan;
                const isPopular = index === 0 && plans.length > 1;
                const limit = Number(plan?.max_purchase_per_user || 0);
                const count = getPlanPurchaseCount(plan?.id);
                const reached = limit > 0 && count >= limit;

                return (
                  <PublicSubscriptionPlanCard
                    key={plan?.id}
                    record={p}
                    isAuthenticated
                    featured={isPopular}
                    actionOverride={{
                      labelKey: reached ? '已达上限' : '立即订阅',
                      disabled: reached,
                      disabledTooltip: reached
                        ? t('已达到购买上限') + ` (${count}/${limit})`
                        : '',
                      onClick: () => openBuy(p),
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className='text-center text-gray-400 text-sm py-4'>
              {t('暂无可购买套餐')}
            </div>
          )}
        </Space>
      )}
    </>
  );

  return (
    <>
      {withCard ? (
        <Card className='!rounded-2xl shadow-sm border-0'>{cardContent}</Card>
      ) : (
        <div className='space-y-3'>{cardContent}</div>
      )}

      {/* 购买确认弹窗 */}
      <SubscriptionPurchaseModal
        t={t}
        visible={open}
        onCancel={closeBuy}
        selectedPlan={selectedPlan}
        paying={paying}
        selectedEpayMethod={selectedEpayMethod}
        setSelectedEpayMethod={setSelectedEpayMethod}
        epayMethods={epayMethods}
        enableOnlineTopUp={enableOnlineTopUp}
        enableStripeTopUp={enableStripeTopUp}
        enableCreemTopUp={enableCreemTopUp}
        purchaseLimitInfo={
          selectedPlan?.plan?.id
            ? {
                limit: Number(selectedPlan?.plan?.max_purchase_per_user || 0),
                count: getPlanPurchaseCount(selectedPlan?.plan?.id),
              }
            : null
        }
        onPayBalance={payBalance}
        onPayStripe={payStripe}
        onPayCreem={payCreem}
        onPayEpay={payEpay}
      />
    </>
  );
};

export default SubscriptionPlansCard;
