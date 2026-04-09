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
import {
  formatSubscriptionAmountValue,
  getSubscriptionQuotaLimitTitle,
  formatSubscriptionResetMode,
  getSubscriptionQuotaLimitItems,
  formatSubscriptionUsageSummary,
} from '../../helpers/subscriptionFormat';

const { Text } = Typography;

export function hasQuotaLimitConfig(source) {
  return getSubscriptionQuotaLimitItems(source, (value) => value).length > 0;
}

const SubscriptionQuotaLimitSummary = ({
  source,
  t,
  variant = 'plan',
  title,
}) => {
  const items = getSubscriptionQuotaLimitItems(source, t);
  if (items.length === 0) return null;

  return (
    <div className='rounded-lg bg-gray-50/80 px-3 py-2'>
      <div className='flex items-center gap-2 mb-2'>
        <Text strong size='small'>
          {title || getSubscriptionQuotaLimitTitle(source, t)}
        </Text>
        <Tag color='orange' size='small' shape='circle'>
          {items.length} {t('项')}
        </Tag>
      </div>

      <Space vertical spacing={6} style={{ width: '100%' }}>
        {items.map((item) => {
          const usageSummary = formatSubscriptionUsageSummary(
            {
              used: item.used,
              total: item.amount,
            },
            item,
            t,
            renderQuota,
          );
          return (
            <div key={item.key} className='w-full'>
              <div className='flex items-center gap-2 flex-wrap text-xs'>
                <Badge dot type='warning' />
                <Text size='small'>{item.label}</Text>
                <Tag size='small'>
                  {formatSubscriptionAmountValue(
                    item.amount,
                    item,
                    t,
                    renderQuota,
                  )}
                </Tag>
                <Tag size='small' color='white'>
                  {formatSubscriptionResetMode(item.mode, t)}
                </Tag>
              </div>

              {variant === 'subscription' && (
                <div className='ml-4 mt-1 text-xs text-gray-500'>
                  <span>
                    {t('已用')} {usageSummary.usedText} /{' '}
                    {usageSummary.totalText}
                  </span>
                  <span className='mx-2'>·</span>
                  <span>
                    {t('剩余')} {usageSummary.remainText}
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
