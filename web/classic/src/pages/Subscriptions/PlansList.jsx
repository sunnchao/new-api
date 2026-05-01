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
import { Card, Button, Typography, Space, Spin, Tag } from '@douyinfe/semi-ui';
import { renderQuota } from '../../helpers';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const formatQuotaLimit = (value, t) =>
  value && value > 0 ? renderQuota(value) : t('不限');

const formatDuration = (value, unit, t, language = 'zh') => {
  if (!unit && value === undefined) return '-';
  if (!unit || value === undefined || value === null) return '-';
  const unitLabelMap = {
    day: t('天'),
    week: t('周'),
    month: t('月'),
    year: t('年'),
    quarter: t('季度'),
  };
  const isChinese = language.startsWith('zh');
  const unitLabel = isChinese && unit === 'month' ? '个月' : unitLabelMap[unit] || unit;
  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) return '-';
  const needsSpace = !['zh', 'ja', 'ko'].some((prefix) => language.startsWith(prefix));
  return `${normalizedValue}${needsSpace ? ' ' : ''}${unitLabel}`;
};

const PlansList = ({ plans, loading, onPurchase }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || 'zh';

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Spin />
      </div>
    );
  }

  if (plans.length === 0) {
    return <Text>{t('暂无套餐方案')}</Text>;
  }

  return (
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
              <Text>{`${t('每日额度上限')}: ${formatQuotaLimit(plan.daily_quota_per_plan, t)}`}</Text>
              <Text>{`${t('每周额度上限')}: ${formatQuotaLimit(plan.weekly_quota_per_plan, t)}`}</Text>
              <Text>{`${t('每月额度上限')}: ${formatQuotaLimit(plan.monthly_quota_per_plan, t)}`}</Text>
              <Text>{`${t('有效期')}: ${formatDuration(plan.duration_value, plan.duration_unit, t, currentLanguage)}`}</Text>
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
              <Button theme='solid' onClick={() => onPurchase(plan)}>
                {t('立即购买')}
              </Button>
            </Space>
          </Card>
        );
      })}
    </div>
  );
};

export default PlansList;
