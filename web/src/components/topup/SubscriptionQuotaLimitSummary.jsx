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
import { Badge, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { renderQuota } from '../../helpers';
import { formatSubscriptionResetMode } from '../../helpers/subscriptionFormat';

const { Text } = Typography;

function getQuotaLimitItems(source, t) {
  if (!source) return [];

  const hourlyAmount = Number(source?.hourly_limit_amount || 0);
  const hourlyHours = Number(source?.hourly_limit_hours || 1);
  const dailyAmount = Number(source?.daily_limit_amount || 0);
  const weeklyAmount = Number(source?.weekly_limit_amount || 0);
  const monthlyAmount = Number(source?.monthly_limit_amount || 0);

  return [
    hourlyAmount > 0
      ? {
          key: 'hourly',
          label: `${t('每')}${hourlyHours}${t('小时')}`,
          amount: hourlyAmount,
          mode: source?.hourly_reset_mode,
          used: Number(source?.hourly_amount_used || 0),
          nextResetTime: Number(source?.hourly_next_reset_time || 0),
        }
      : null,
    dailyAmount > 0
      ? {
          key: 'daily',
          label: t('每天'),
          amount: dailyAmount,
          mode: source?.daily_reset_mode,
          used: Number(source?.daily_amount_used || 0),
          nextResetTime: Number(source?.daily_next_reset_time || 0),
        }
      : null,
    weeklyAmount > 0
      ? {
          key: 'weekly',
          label: t('每周'),
          amount: weeklyAmount,
          mode: source?.weekly_reset_mode,
          used: Number(source?.weekly_amount_used || 0),
          nextResetTime: Number(source?.weekly_next_reset_time || 0),
        }
      : null,
    monthlyAmount > 0
      ? {
          key: 'monthly',
          label: t('每月'),
          amount: monthlyAmount,
          mode: source?.monthly_reset_mode,
          used: Number(source?.monthly_amount_used || 0),
          nextResetTime: Number(source?.monthly_next_reset_time || 0),
        }
      : null,
  ].filter(Boolean);
}

export function hasQuotaLimitConfig(source) {
  return getQuotaLimitItems(source, (value) => value).length > 0;
}

const SubscriptionQuotaLimitSummary = ({
  source,
  t,
  variant = 'plan',
  title,
}) => {
  const items = getQuotaLimitItems(source, t);
  if (items.length === 0) return null;

  return (
    <div className='rounded-lg bg-gray-50/80 px-3 py-2'>
      <div className='flex items-center gap-2 mb-2'>
        <Text strong size='small'>
          {title || t('额度限制')}
        </Text>
        <Tag color='orange' size='small' shape='circle'>
          {items.length} {t('项')}
        </Tag>
      </div>

      <Space vertical spacing={6} style={{ width: '100%' }}>
        {items.map((item) => {
          const remain = Math.max(0, item.amount - item.used);
          return (
            <div key={item.key} className='w-full'>
              <div className='flex items-center gap-2 flex-wrap text-xs'>
                <Badge dot type='warning' />
                <Text size='small'>{item.label}</Text>
                <Tag size='small'>{renderQuota(item.amount)}</Tag>
                {/*<Tag size='small' color='white'>*/}
                {/*  {formatSubscriptionResetMode(item.mode, t)}*/}
                {/*</Tag>*/}
              </div>

              {variant === 'subscription' && (
                <div className='ml-4 mt-1 text-xs text-gray-500'>
                  <span>
                    {t('已用')} {renderQuota(item.used)} / {renderQuota(item.amount)}
                  </span>
                  <span className='mx-2'>·</span>
                  <span>
                    {t('剩余')} {renderQuota(remain)}
                  </span>
                  {item.nextResetTime > 0 && (
                    <>
                      <span className='mx-2'>·</span>
                      <span>
                        {t('下次重置')}{' '}
                        {new Date(item.nextResetTime * 1000).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Space>
    </div>
  );
};

export default SubscriptionQuotaLimitSummary;
