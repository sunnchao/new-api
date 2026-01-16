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

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Typography,
  Progress,
  Space,
  Modal,
  Select,
  Tag,
  Spin,
  Banner,
} from '@douyinfe/semi-ui';
import {API, renderQuota } from '../../helpers';

const { Title, Text } = Typography;

const statusMap = {
  active: { label: 'packages.subscription.active', color: 'green' },
  expired: { label: 'packages.subscription.expired', color: 'grey' },
  cancelled: { label: 'packages.subscription.cancelled', color: 'orange' },
  exhausted: { label: 'packages.subscription.exhausted', color: 'red' },
  pending: { label: 'packages.subscription.pending', color: 'blue' },
};

const formatQuota = (value) => {
  if (!Number.isFinite(value)) return '-';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}W`;
  }
  return `${value}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

const Subscriptions = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState(null);
  const [error, setError] = useState('');
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const priority = (status) => (status === 'active' ? 0 : 1);
    const priorityDiff = priority(a.status) - priority(b.status);
    if (priorityDiff !== 0) return priorityDiff;
    return (b.start_time || 0) - (a.start_time || 0);
  });

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError('');
    try {
      const res = await API.get('/api/user/packages/plans');
      if (res?.data?.success) {
        setPlans(res.data.data || []);
      } else {
        setError(res?.data?.message || t('packages.error.loadPlans'));
      }
    } catch (err) {
      setError(err.message || t('packages.error.loadPlans'));
    } finally {
      setLoadingPlans(false);
    }
  }, [t]);

  const loadSubscriptions = useCallback(async () => {
    setLoadingSubscriptions(true);
    setError('');
    try {
      const res = await API.get('/api/user/packages/subscriptions');
      if (res?.data?.success) {
        setSubscriptions(res.data.data || []);
      } else {
        setError(res?.data?.message || t('packages.error.loadPlans'));
      }
    } catch (err) {
      setError(err.message || t('packages.error.loadPlans'));
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [t]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadPlans(), loadSubscriptions()]);
  }, [loadPlans, loadSubscriptions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openPurchase = (plan) => {
    setSelectedPlan(plan);
    setPurchaseOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPlan) return;
    setPurchaseLoading(true);
    try {
      const res = await API.post('/api/user/packages/purchase', {
        plan_type: selectedPlan.type,
        hash_id: selectedPlan.hash_id,
        payment_method: 'balance',
      });

      if (res?.data?.success) {
        Modal.success({
          title: t('packages.purchase.success'),
          content: res.data.message || t('packages.purchase.success'),
        });
        setPurchaseOpen(false);
        await loadAll();
      } else {
        Modal.error({
          title: t('packages.purchase.failed'),
          content: res?.data?.message || t('packages.purchase.failed'),
        });
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const cancelSubscription = async (subscription) => {
    Modal.confirm({
      title: t('packages.cancel.confirmTitle'),
      content: t('packages.cancel.confirmContent'),
      okText: t('packages.cancel.confirmAction'),
      cancelText: t('packages.cancel.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        const res = await API.post('/api/user/packages/cancel', {
          hash_id: subscription.hash_id,
        });
        if (res?.data?.success) {
          Modal.success({
            title: t('packages.cancel.success'),
            content: res.data.message || t('packages.cancel.success'),
          });
          await loadSubscriptions();
        } else {
          Modal.error({
            title: t('packages.cancel.failed'),
            content: res?.data?.message || t('packages.cancel.failed'),
          });
        }
      },
    });
  };

  const resetDailyQuota = async (subscription) => {
    Modal.confirm({
      title: t('packages.reset.confirmTitle'),
      content: t('packages.reset.confirmContent'),
      okText: t('packages.reset.confirmAction'),
      cancelText: t('packages.reset.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        setResetLoadingId(subscription.id);
        try {
          const res = await API.post('/api/user/packages/reset', {
            hash_id: subscription.hash_id,
          });
          if (res?.data?.success) {
            Modal.success({
              title: t('packages.reset.success'),
              content: res.data.message || t('packages.reset.success'),
            });
            await loadSubscriptions();
          } else {
            Modal.error({
              title: t('packages.reset.failed'),
              content: res?.data?.message || t('packages.reset.failed'),
            });
          }
        } finally {
          setResetLoadingId(null);
        }
      },
    });
  };

  return (
      <div className='mt-[60px] px-2'>
        <div className='flex flex-col gap-4'>
          {error && <Banner type='danger' description={error} />}

          <Card
              title={t('packages.plan.title')}
          >
            {loadingPlans ? (
                <div className='flex justify-center py-8'>
                  <Spin />
                </div>
            ) : plans.length === 0 ? (
                <Text>{t('packages.plan.empty')}</Text>
            ) : (
                <div className='grid gap-4 md:grid-cols-2'>
                  {plans.map((plan) => (
                      <Card key={plan.id} bordered={true} shadows='hover'>
                        <Space vertical align='start' spacing='tight'>
                          <Title heading={5}>{plan.name || plan.type}</Title>
                          <Text type='secondary'>{plan.description}</Text>
                          <Text>{`${t('packages.plan.price')}: ${plan.price} ${plan.currency}`}</Text>
                          <Text>{`${t('packages.plan.quota')}: ${renderQuota(plan.total_quota)}`}</Text>
                          <Text>{`${t('packages.plan.duration')}: ${plan.duration_unit || '-'} ${plan.duration_value || '-'}`}</Text>
                          <Text>{`${t('packages.plan.service')}: ${plan.service_type}`}</Text>
                          <Button theme='solid' onClick={() => openPurchase(plan)}>
                            {t('packages.plan.buy')}
                          </Button>
                        </Space>
                      </Card>
                  ))}
                </div>
            )}
          </Card>

          <Card
              title={t('packages.subscription.list')}
              className={'w-full'}
              headerExtraContent={(
                  <Button
                      onClick={loadSubscriptions}
                      loading={loadingSubscriptions}
                  >
                    {t('packages.action.refresh')}
                  </Button>
              )}
          >
            {loadingSubscriptions ? (
                <div className='flex justify-center py-8'>
                  <Spin />
                </div>
            ) : subscriptions.length === 0 ? (
                <Text>{t('packages.subscription.empty')}</Text>
            ) : (
                <div className='w-full grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                  {sortedSubscriptions.map((sub) => {
                    const status = statusMap[sub.status] || statusMap.pending;
                    const remainQuota = Math.max(sub.remain_quota || 0, 0);
                    const totalQuota = Math.max(sub.total_quota || 0, 0);
                    const usedQuota = Math.max(totalQuota - remainQuota, 0);
                    const progressPercent = totalQuota
                        ? Math.min(100, Math.round((usedQuota / totalQuota) * 100))
                        : 0;
                    const resetLimit = Math.max(sub.reset_quota_limit || 0, 0);
                    const resetUsed = Math.max(sub.reset_quota_used || 0, 0);
                    const resetRemaining = Math.max(resetLimit - resetUsed, 0);
                    return (
                        <Card key={sub.id} bordered className={'w-full'}>
                          <Space vertical align='start' spacing='tight' className={'w-full'}>
                            <div className='flex items-center gap-2'>
                              <Title heading={5}>
                                {sub.package_plan?.name || sub.package_plan?.type }
                              </Title>
                              <Tag color={status.color}>{t(status.label)}</Tag>
                            </div>
                            <Text type='secondary'>
                              {`${t('packages.subscription.service')}: ${sub.service_type}`}
                            </Text>
                            <Text type='secondary'>
                              {`${t('packages.admin.plans.deductionGroup')}: ${sub.deduction_group}`}
                            </Text>
                            <div className='w-full'>
                              <div className='flex items-center justify-between text-sm text-gray-600'>
                                <span>{t('packages.subscription.remain')}</span>
                                <span>
                            {renderQuota(remainQuota, 6)} /{' '}
                                  {renderQuota(totalQuota, 6)}
                          </span>
                              </div>
                              <Progress percent={progressPercent} showInfo={false} />
                              <div className='mt-1 flex items-center justify-between text-xs text-gray-500'>
                                <span>{`${t('packages.subscription.used')}: ${renderQuota(usedQuota, 6)}`}</span>
                                <span>{`${progressPercent}%`}</span>
                              </div>
                              <div className='mt-2 flex items-center justify-between text-xs text-gray-500'>
                          <span>
                            {t('packages.subscription.resetRemaining')}
                          </span>
                                <span>
                            {resetRemaining} / {resetLimit}
                          </span>
                              </div>
                            </div>
                            <Text type='secondary'>
                              {`${t('packages.subscription.end')}: ${formatDate(sub.end_time)}`}
                            </Text>
                            <Space>
                              <Button
                                  type='danger'
                                  disabled={
                                      sub.status !== 'active' ||
                                      resetRemaining <= 0 ||
                                      resetLoadingId === sub.id
                                  }
                                  loading={resetLoadingId === sub.id}
                                  onClick={() => resetDailyQuota(sub)}
                              >
                                {t('packages.reset.confirmAction')}
                              </Button>
                              <Button
                                  type='danger'
                                  disabled={sub.status !== 'active'}
                                  onClick={() => cancelSubscription(sub)}
                              >
                                {t('packages.cancel.confirmAction')}
                              </Button>
                            </Space>
                          </Space>
                        </Card>
                    );
                  })}
                </div>
            )}
          </Card>

          <Modal
              title={t('packages.purchase.title')}
              visible={purchaseOpen}
              onCancel={() => setPurchaseOpen(false)}
              onOk={confirmPurchase}
              confirmLoading={purchaseLoading}
          >
            <Space vertical align='start' style={{ width: '100%' }}>
              <Text>{t('packages.purchase.selectPlan')}</Text>
              <Select
                  style={{ width: '100%' }}
                  optionList={plans.map((plan) => ({
                    label: `${plan.name || plan.type} (${plan.service_type || '-'})`,
                    value: plan.type,
                  }))}
                  value={selectedPlan?.type}
                  onChange={(value) => {
                    const plan = plans.find((item) => item.type === value);
                    setSelectedPlan(plan || null);
                  }}
              />
              <Text>{`${t('packages.purchase.payment')}: balance`}</Text>
              {selectedPlan && (
                  <Text type='secondary'>
                    {`${t('packages.plan.price')}: ${selectedPlan.price} ${selectedPlan.currency}`}
                  </Text>
              )}
            </Space>
          </Modal>
        </div>
      </div>
  );
};

export default Subscriptions;
