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
import { Divider, Tag, Typography } from '@douyinfe/semi-ui';
import { renderQuota } from '../../helpers';
import {
  formatSubscriptionDuration,
  formatSubscriptionLimitValue,
  formatSubscriptionResetPeriod,
  formatSubscriptionTotalValue,
  getSubscriptionQuotaLimitItems,
  getSubscriptionQuotaLimitTitle,
  getSubscriptionTotalLabel,
} from '../../helpers/subscriptionFormat';

const { Text } = Typography;

const HomeSubscriptionPlanMetrics = ({ plan, t }) => {
  const quotaLimitItems = getSubscriptionQuotaLimitItems(plan, t);
  const hasQuotaLimits = quotaLimitItems.length > 0;

  return (
    <div className='space-y-3 mb-8'>
      <div className='flex items-center justify-between gap-4'>
        <Text type='tertiary'>{getSubscriptionTotalLabel(plan, t)}</Text>
        <Text strong>
          {Number(plan?.total_amount || 0) > 0
            ? formatSubscriptionTotalValue(
                plan.total_amount,
                plan,
                t,
                renderQuota,
                {
                  approximateTimes:
                    plan?.approximate_times ?? plan?.approximateTimes,
                },
              )
            : t('不限')}
        </Text>
      </div>

      <div className='flex items-center justify-between gap-4'>
        <Text type='tertiary'>{t('有效期')}</Text>
        <Text strong>{formatSubscriptionDuration(plan, t)}</Text>
      </div>

      <div className='flex items-center justify-between gap-4'>
        <Text type='tertiary'>{t('购买上限')}</Text>
        <Text strong>
          {Number(plan?.max_purchase_per_user || 0) > 0
            ? plan.max_purchase_per_user
            : t('不限')}
        </Text>
      </div>

      {plan?.allowed_groups && plan.allowed_groups.trim() !== '' ? (
        <div className='flex items-center justify-between gap-4'>
          <Text type='tertiary'>{t('可用分组')}</Text>
          <div className='flex flex-wrap justify-end gap-1'>
            {plan.allowed_groups.split(',').map((group, idx) => (
              <Tag key={idx} size='small' style={{ margin: 0 }}>
                {group.trim()}
              </Tag>
            ))}
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-between gap-4'>
          <Text type='tertiary'>{t('可用分组')}</Text>
          <div className='flex flex-wrap justify-end gap-1'>{t('不限')}</div>
        </div>
      )}

      {hasQuotaLimits && (
        <>
          <div className='mb-4'>
            <Text type='tertiary' className='text-xs uppercase tracking-wide'>
              {getSubscriptionQuotaLimitTitle(plan, t)}
            </Text>
          </div>
          <Divider margin='12px 0' />

          <div className='space-y-2 mb-6'>
            {quotaLimitItems.map((item) => (
              <div
                key={item.key}
                className='flex items-center justify-between gap-4'
              >
                <Text type='tertiary'>{item.label}</Text>
                <div className='flex items-center gap-2'>
                  <Text strong>
                    {formatSubscriptionLimitValue(
                      item.amount,
                      item,
                      t,
                      renderQuota,
                      {
                        approximateTimes: item.approximateTimes,
                      },
                    )}
                  </Text>
                  {item.nextResetTime > 0 && (
                    <Text type='tertiary' className='text-xs'>
                      ({formatSubscriptionResetPeriod(
                        {
                          quota_reset_period: item.key,
                          quota_reset_mode: item.mode,
                        },
                        t,
                        { shortMode: true },
                      )})
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeSubscriptionPlanMetrics;
