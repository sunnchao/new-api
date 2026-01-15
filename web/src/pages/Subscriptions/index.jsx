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
import { Card, Button, Typography, Progress, Space, Modal, Select, Tag, Spin, Banner } from '@douyinfe/semi-ui';
import { API } from '../../helpers';

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
  const [loading, setLoading] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [plansRes, subsRes] = await Promise.all([
        API.get('/api/user/packages/plans'),
        API.get('/api/user/packages/subscriptions'),
      ]);

      if (plansRes?.data?.success) {
        setPlans(plansRes.data.data || []);
      } else {
        setError(plansRes?.data?.message || t('packages.error.loadPlans'));
      }

      if (subsRes?.data?.success) {
        setSubscriptions(subsRes.data.data || []);
      }
    } catch (err) {
      setError(err.message || t('packages.error.loadPlans'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        await loadData();
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
      title: t('packages.cancel.confirm'),
      content: t('packages.cancel.confirmContent'),
      okText: t('packages.cancel.confirm'),
      cancelText: t('packages.cancel.cancel'),
      onOk: async () => {
        const res = await API.post('/api/user/packages/cancel', { hash_id: subscription.hash_id });
        if (res?.data?.success) {
          Modal.success({
            title: t('packages.cancel.success'),
            content: res.data.message || t('packages.cancel.success'),
          });
          await loadData();
        } else {
          Modal.error({
            title: t('packages.cancel.failed'),
            content: res?.data?.message || t('packages.cancel.failed'),
          });
        }
      },
    });
  };

  return (
    <div className='w-full max-w-7xl mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <Title heading={4}>{t('packages.subscription.title')}</Title>
          <Button onClick={loadData} loading={loading}>
            {t('packages.action.refresh')}
          </Button>
        </div>

        {error && <Banner type='danger' description={error} />}

        <Card title={t('packages.plan.title')}>
          {loading ? (
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
                    <Text>{`${t('packages.plan.quota')}: ${formatQuota(plan.total_quota)}`}</Text>
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

        <Card title={t('packages.subscription.list')}>
          {loading ? (
            <div className='flex justify-center py-8'>
              <Spin />
            </div>
          ) : subscriptions.length === 0 ? (
            <Text>{t('packages.subscription.empty')}</Text>
          ) : (
            <div className='grid gap-4'>
              {subscriptions.map((sub) => {
                const status = statusMap[sub.status] || statusMap.pending;
                const progress = sub.total_quota
                  ? Math.round(((sub.total_quota - sub.remain_quota) / sub.total_quota) * 100)
                  : 0;
                return (
                  <Card key={sub.id} bordered shadows='hover'>
                    <Space vertical align='start' spacing='tight'>
                      <div className='flex items-center gap-2'>
                        <Title heading={5}>{sub.package_plan?.type || sub.plan_type}</Title>
                        <Tag color={status.color}>{t(status.label)}</Tag>
                      </div>
                      <Text>{`${t('packages.subscription.service')}: ${sub.service_type}`}</Text>
                      <Text>{`${t('packages.subscription.remain')}: ${formatQuota(sub.remain_quota)} / ${formatQuota(sub.total_quota)}`}</Text>
                      <Progress percent={progress} showInfo />
                      <Text>{`${t('packages.subscription.end')}: ${formatDate(sub.end_time)}`}</Text>
                      <Space>
                        <Button disabled={sub.status !== 'active'} onClick={() => cancelSubscription(sub)}>
                          {t('packages.cancel.confirm')}
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
