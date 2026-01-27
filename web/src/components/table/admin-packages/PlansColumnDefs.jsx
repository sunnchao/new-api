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
import { Button, Space } from '@douyinfe/semi-ui';
import { renderQuota } from '../../../helpers';

export const getPlansColumns = ({
  t,
  openPlanModal,
  handleDeletePlan,
  formatQuotaLimit,
}) => [
  {
    title: t('名称'),
    dataIndex: 'name',
    render: (name, record) => name || record.type,
  },
  {
    title: t('类型'),
    dataIndex: 'type',
  },
  {
    title: t('价格'),
    render: (_, record) => `${record.price} ${record.currency}`,
  },
  {
    title: t('额度'),
    dataIndex: 'total_quota',
    render: (_, record) => `${renderQuota(record.total_quota)}`,
  },
  {
    title: t('每日额度上限'),
    dataIndex: 'daily_quota_per_plan',
    render: (value) => formatQuotaLimit(value),
  },
  {
    title: t('每周额度上限'),
    dataIndex: 'weekly_quota_per_plan',
    render: (value) => formatQuotaLimit(value),
  },
  {
    title: t('每月额度上限'),
    dataIndex: 'monthly_quota_per_plan',
    render: (value) => formatQuotaLimit(value),
  },
  // {
  //   title: t('可重置次数'),
  //   dataIndex: 'reset_quota_limit',
  //   render: (value) => value ?? 1,
  // },
  {
    title: t('时长'),
    render: (_, record) => {
      if (record.is_unlimited_time) {
        return t('不限时长');
      }
      const unitLabelMap = {
        day: t('天'),
        week: t('周'),
        month: t('月'),
        quarter: t('季度'),
      };
      const unitLabel = unitLabelMap[record.duration_unit] || record.duration_unit || '-';
      return `${record.duration_value || 0} ${unitLabel}`;
    },
  },
  {
    title: t('操作'),
    dataIndex: 'operate',
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <Button onClick={() => openPlanModal(record)}>{t('编辑')}</Button>
        <Button type='danger' onClick={() => handleDeletePlan(record)}>
          {t('删除')}
        </Button>
      </Space>
    ),
  },
];
