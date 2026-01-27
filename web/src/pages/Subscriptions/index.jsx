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
  Progress,
  Space,
  Modal,
  Select,
  Tag,
  Spin,
  Banner,
} from '@douyinfe/semi-ui';
import { API, renderQuota } from '../../helpers';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const getStatusMap = (t) => ({
  active: { label: t('生效中'), color: 'green' },
  expired: { label: t('已过期'), color: 'grey' },
  cancelled: { label: t('已取消'), color: 'orange' },
  exhausted: { label: t('已耗尽'), color: 'red' },
  pending: { label: t('待生效'), color: 'blue' },
});

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

const formatDate = (timestamp, language = 'zh') => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);

  // 根据语言返回不同的日期格式
  const localeMap = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    fr: 'fr-FR',
    ru: 'ru-RU',
    vi: 'vi-VN',
  };

  const locale = localeMap[language] || 'zh-CN';

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const Subscriptions = () => {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState(null);
  const [error, setError] = useState('');
  const statusMap = getStatusMap(t);
  const currentLanguage = i18n.language || 'zh';
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

        <Card
          title={t('套餐方案')}
        >
          {loadingPlans ? (
            <div className='flex justify-center py-8'>
              <Spin />
            </div>
          ) : plans.length === 0 ? (
            <Text>{t('暂无套餐方案')}</Text>
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {plans.map((plan) => {
                const deductionGroups = plan.deduction_group
                  ? plan.deduction_group.split(',').map(g => g.trim()).filter(Boolean)
                  : [];
                const showGroupInfo = deductionGroups.length > 0;

                return (
                  <Card key={plan.id} bordered={true} shadows='hover'>
                    <Space vertical align='start' spacing='tight'>
                      <Title heading={5}>{plan.name || plan.type}</Title>
                      <Text type='secondary'>{plan.description}</Text>
                      <Text>{`${t('价格')}: ${plan.price} ${plan.currency}`}</Text>
                      <Text>{`${t('总额度')}: ${renderQuota(plan.total_quota)}`}</Text>
                      <Text>{`${t('有效期')}: ${plan.duration_unit || '-'} ${plan.duration_value || '-'}`}</Text>
                      {showGroupInfo && (
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
                      )}
                      {!showGroupInfo && (
                        <Text type='tertiary' size='small'>
                          {t('所有分组均可使用')}
                        </Text>
                      )}
                      <Button theme='solid' onClick={() => openPurchase(plan)}>
                        {t('立即购买')}
                      </Button>
                    </Space>
                  </Card>
                );
              })}
            </div>
          )}
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
          {loadingSubscriptions ? (
            <div className='flex justify-center py-8'>
              <Spin />
            </div>
          ) : subscriptions.length === 0 ? (
            <Text>{t('暂无订阅')}</Text>
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
                          {sub.package_plan?.name || sub.package_plan?.type}
                        </Title>
                          <Tag color={status.color}>{status.label}</Tag>
                        </div>
                        {(() => {
                        const deductionGroups = sub.deduction_group
                          ? sub.deduction_group.split(',').map(g => g.trim()).filter(Boolean)
                          : [];

                        return (
                          <Space vertical align='start' className='w-full'>
                            <Text type='secondary'>
                              {`${t('抵扣分组')}:`}
                            </Text>
                            {deductionGroups.length > 0 ? (
                              <Space wrap size='small' className='w-full'>
                                {deductionGroups.map((group, idx) => (
                                  <Tag key={idx} color='cyan' size='small'>
                                    {group}
                                  </Tag>
                                ))}
                              </Space>
                            ) : (
                              <Tag color='green' size='small'>
                                {t('所有分组')}
                              </Tag>
                            )}
                          </Space>
                        );
                      })()}
                      <div className='w-full'>
                        <div className='flex items-center justify-between text-sm text-gray-600'>
                          <span>{t('剩余额度')}</span>
                          <span>
                            {renderQuota(remainQuota, 6)} /{' '}
                            {renderQuota(totalQuota, 6)}
                          </span>
                        </div>
                        <Progress percent={progressPercent} showInfo={false} />
                        <div className='mt-1 flex items-center justify-between text-xs text-gray-500'>
                          <span>{`${t('已用额度')}: ${renderQuota(usedQuota, 6)}`}</span>
                          <span>{`${progressPercent}%`}</span>
                        </div>
                        {/*<div className='mt-2 flex items-center justify-between text-xs text-gray-500'>*/}
                        {/*  <span>*/}
                        {/*    {t('可重置次数')}*/}
                        {/*  </span>*/}
                        {/*  <span>*/}
                        {/*    {resetRemaining} / {resetLimit}*/}
                        {/*  </span>*/}
                        {/*</div>*/}
                      </div>
                      <Text type='secondary'>
                        {`${t('到期时间')}: ${formatDate(sub.end_time, currentLanguage)}`}
                      </Text>
                      <Space>
                        {/*<Button*/}
                        {/*  type='danger'*/}
                        {/*  disabled={*/}
                        {/*    sub.status !== 'active' ||*/}
                        {/*    resetRemaining <= 0 ||*/}
                        {/*    resetLoadingId === sub.id*/}
                        {/*  }*/}
                        {/*  loading={resetLoadingId === sub.id}*/}
                        {/*  onClick={() => resetDailyQuota(sub)}*/}
                        {/*>*/}
                        {/*  {t('确认重置')}*/}
                        {/*</Button>*/}
                        {/*<Button*/}
                        {/*  type='danger'*/}
                        {/*  disabled={sub.status !== 'active'}*/}
                        {/*  onClick={() => cancelSubscription(sub)}*/}
                        {/*>*/}
                        {/*  {t('取消订阅')}*/}
                        {/*</Button>*/}
                      </Space>
                    </Space>
                  </Card>
                );
              })}
            </div>
          )}
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
