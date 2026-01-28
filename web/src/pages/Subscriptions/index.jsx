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
import {
  Card,
  Button,
  Typography,
  Space,
  Modal,
  Select,
  Tag,
  Banner,
} from '@douyinfe/semi-ui';
import { API, renderQuota } from '../../helpers';
import { useTranslation } from 'react-i18next';
import PlansList from './PlansList';
import SubscriptionsList from './SubscriptionsList';

const { Text } = Typography;

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

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError('');
    try {
      const res = await API.get('/api/user/packages/plans');
      if (res?.data?.success) {
        setPlans(res.data.data || []);
      } else {
        setError(res?.data?.message || t('加载套餐方案失败'));
      }
    } catch (err) {
      setError(err.message || t('加载套餐方案失败'));
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setLoadingSubscriptions(true);
    setError('');
    try {
      const res = await API.get('/api/user/packages/subscriptions');
      if (res?.data?.success) {
        setSubscriptions(res.data.data || []);
      } else {
        setError(res?.data?.message || t('加载订阅信息失败'));
      }
    } catch (err) {
      setError(err.message || t('加载订阅信息失败'));
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

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
          title: t('购买成功'),
          content: res.data.message || t('购买成功'),
        });
        setPurchaseOpen(false);
        await loadAll();
      } else {
        Modal.error({
          title: t('购买失败'),
          content: res?.data?.message || t('购买失败'),
        });
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const cancelSubscription = async (subscription) => {
    Modal.confirm({
      title: t('确认取消订阅'),
      content: t('取消后当前订阅将不再续费，是否继续？'),
      okText: t('确认取消'),
      cancelText: t('返回'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        const res = await API.post('/api/user/packages/cancel', {
          hash_id: subscription.hash_id,
        });
        if (res?.data?.success) {
          Modal.success({
            title: t('取消成功'),
            content: res.data.message || t('取消成功'),
          });
          await loadSubscriptions();
        } else {
          Modal.error({
            title: t('取消失败'),
            content: res?.data?.message || t('取消失败'),
          });
        }
      },
    });
  };

  const resetDailyQuota = async (subscription) => {
    Modal.confirm({
      title: t('确认重置额度'),
      content: t('重置将消耗一次重置次数，是否继续？'),
      okText: t('确认重置'),
      cancelText: t('返回'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        setResetLoadingId(subscription.id);
        try {
          const res = await API.post('/api/user/packages/reset', {
            hash_id: subscription.hash_id,
          });
          if (res?.data?.success) {
            Modal.success({
              title: t('重置成功'),
              content: res.data.message || t('重置成功'),
            });
            await loadSubscriptions();
          } else {
            Modal.error({
              title: t('重置失败'),
              content: res?.data?.message || t('重置失败'),
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

        <Card title={t('套餐方案')}>
          <PlansList 
            plans={plans} 
            loading={loadingPlans} 
            onPurchase={openPurchase} 
          />
        </Card>

        <Card
          title={t('订阅列表')}
          className={'w-full'}
          headerExtraContent={(
            <Button
              onClick={loadSubscriptions}
              loading={loadingSubscriptions}
            >
              {t('刷新')}
            </Button>
          )}
        >
          <SubscriptionsList 
            subscriptions={subscriptions} 
            loading={loadingSubscriptions}
            resetLoadingId={resetLoadingId}
          />
        </Card>

        <Modal
          title={t('购买套餐')}
          visible={purchaseOpen}
          onCancel={() => setPurchaseOpen(false)}
          onOk={confirmPurchase}
          confirmLoading={purchaseLoading}
        >
          <Space vertical align='start' style={{ width: '100%' }}>
            <Text>{t('选择套餐')}</Text>
            <Select
              style={{ width: '100%' }}
              optionList={plans.map((plan) => ({
                label: plan.name || plan.type,
                value: plan.type,
              }))}
              value={selectedPlan?.type}
              onChange={(value) => {
                const plan = plans.find((item) => item.type === value);
                setSelectedPlan(plan || null);
              }}
            />
            <Text>{`${t('支付方式')}: ${t('余额')}`}</Text>
            {selectedPlan && (
              <>
                <Space vertical align='start' style={{ width: '100%' }}>
                  <Text type='secondary'>
                    {`${t('价格')}: ${selectedPlan.price} ${selectedPlan.currency}`}
                  </Text>
                  <Text type='secondary'>
                    {`${t('总额度')}: ${renderQuota(selectedPlan.total_quota)}`}
                  </Text>
                  {(() => {
                    const deductionGroups = selectedPlan.deduction_group
                      ? selectedPlan.deduction_group.split(',').map(g => g.trim()).filter(Boolean)
                      : [];

                    if (deductionGroups.length > 0) {
                      return (
                        <Space>
                          <Text type='tertiary'>{t('适用分组')}:</Text>
                          <Space wrap size='small'>
                            {deductionGroups.map((group, idx) => (
                              <Tag key={idx} color='blue' size='small'>
                                {group}
                              </Tag>
                            ))}
                          </Space>
                        </Space>
                      );
                    } else {
                      return (
                        <Text type='tertiary' size='small'>
                          {t('所有分组均可使用此套餐')}
                        </Text>
                      );
                    }
                  })()}
                </Space>
              </>
            )}
          </Space>
        </Modal>
      </div>
    </div>
  );
};

export default Subscriptions;
