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
import { Button, InputNumber, Space, Tag } from '@douyinfe/semi-ui';
import { renderQuota } from '../../../helpers';

export const getSubscriptionsColumns = ({
  t,
  resetLimitSavingId,
  handleUpdateResetLimit,
  statusMap,
  formatDate,
  handleCancelSubscription,
  handleDeleteSubscription,
}) => [
  {
    title: t('用户'),
    render: (_, record) =>
      record?.user?.email || record?.user?.username || record?.user_id || '-',
  },
  // {
  //   title: t('可重置次数'),
  //   render: (_, record) => (
  //     <InputNumber
  //       min={0}
  //       size='small'
  //       value={record.reset_quota_limit ?? 1}
  //       disabled={resetLimitSavingId === record.id}
  //       onChange={(value) => handleUpdateResetLimit(record, value)}
  //       style={{ width: 120 }}
  //       placeholder={t('可重置次数')}
  //     />
  //   ),
  // },
  {
    title: t('套餐'),
    render: (_, record) => record?.package_plan?.type || record?.plan_type || '-',
  },
  {
    title: t('状态'),
    dataIndex: 'status',
    render: (status) => {
      const statusInfo = statusMap[status] || statusMap.pending;
      return <Tag color={statusInfo.color}>{t(statusInfo.label)}</Tag>;
    },
  },
  {
    title: t('额度'),
    render: (_, record) =>
      `${renderQuota(record.remain_quota)} / ${renderQuota(record.total_quota)}`,
  },
  {
    title: t('开始时间'),
    dataIndex: 'start_time',
    render: formatDate,
  },
  {
    title: t('结束时间'),
    dataIndex: 'end_time',
    render: formatDate,
  },
  {
    title: t('操作'),
    dataIndex: 'operate',
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <Button
          type='danger'
          disabled={record.status === 'expired' || record.status === 'cancelled'}
          onClick={() => handleCancelSubscription(record)}
        >
          {t('取消')}
        </Button>
        <Button type='danger' onClick={() => handleDeleteSubscription(record)}>
          {t('删除')}
        </Button>
      </Space>
    ),
  },
];
