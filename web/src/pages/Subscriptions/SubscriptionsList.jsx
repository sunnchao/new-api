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

import React from 'react';
import { Card, Typography, Progress, Space, Spin, Tag } from '@douyinfe/semi-ui';
import { renderQuota } from '../../helpers';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const getStatusMap = (t) => ({
  active: { label: t('生效中'), color: 'green' },
  expired: { label: t('已过期'), color: 'grey' },
  cancelled: { label: t('已取消'), color: 'orange' },
  exhausted: { label: t('已耗尽'), color: 'red' },
  pending: { label: t('待生效'), color: 'blue' },
});

const formatQuotaLimit = (value, t) =>
  value && value > 0 ? renderQuota(value) : t('不限');

const formatDate = (timestamp, language = 'zh') => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);

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

const SubscriptionsList = ({ subscriptions, loading, resetLoadingId }) => {
  const { t, i18n } = useTranslation();
  const statusMap = getStatusMap(t);
  const currentLanguage = i18n.language || 'zh';

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const priority = (status) => (status === 'active' ? 0 : 1);
    const priorityDiff = priority(a.status) - priority(b.status);
    if (priorityDiff !== 0) return priorityDiff;
    return (b.start_time || 0) - (a.start_time || 0);
  });

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Spin />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return <Text>{t('暂无订阅')}</Text>;
  }

  return (
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
                <div className='mt-2 space-y-1 text-xs text-gray-500'>
                  <div>{`${t('每日额度上限')}: ${formatQuotaLimit(sub.daily_quota_limit, t)}`}</div>
                  <div>{`${t('每周额度上限')}: ${formatQuotaLimit(sub.weekly_quota_limit, t)}`}</div>
                  <div>{`${t('每月额度上限')}: ${formatQuotaLimit(sub.monthly_quota_limit, t)}`}</div>
                </div>
                <div className={'mt-2 mb-2'}>
                  <Progress percent={progressPercent} showInfo={false} />
                </div>
                <div className='flex items-center justify-between text-xs text-gray-500'>
                  <span>{`${t('已用额度')}: ${renderQuota(usedQuota, 6)}`}</span>
                  <span>{`${progressPercent}%`}</span>
                </div>
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
  );
};

export default SubscriptionsList;
