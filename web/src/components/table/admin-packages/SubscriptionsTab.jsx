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

import React, { useMemo } from 'react';
import { Card, Typography } from '@douyinfe/semi-ui';
import { CreditCard } from 'lucide-react';
import { getSubscriptionsColumns } from './SubscriptionsColumnDefs';
import SubscriptionsFilters from './SubscriptionsFilters';
import CardTable from '../../common/ui/CardTable';
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const SubscriptionsTab = ({
  t,
  subscriptions,
  loading,
  activePage,
  pageSize,
  total,
  setActivePage,
  setPageSize,
  loadSubscriptions,
  handleOpenGrantModal,
  resetLimitSavingId,
  handleUpdateResetLimit,
  statusMap,
  formatDate,
  handleCancelSubscription,
  handleDeleteSubscription,
  compactMode,
  setCompactMode,
}) => {
  const subscriptionColumns = useMemo(
    () =>
      getSubscriptionsColumns({
        t,
        resetLimitSavingId,
        handleUpdateResetLimit,
        statusMap,
        formatDate,
        handleCancelSubscription,
        handleDeleteSubscription,
      }),
    [
      t,
      resetLimitSavingId,
      handleUpdateResetLimit,
      statusMap,
      formatDate,
      handleCancelSubscription,
      handleDeleteSubscription,
    ],
  );

  const { Text } = Typography;

  const tableColumns = useMemo(() => {
    return compactMode
      ? subscriptionColumns.map((col) => {
          if (col.dataIndex === 'operate') {
            const { fixed, ...rest } = col;
            return rest;
          }
          return col;
        })
      : subscriptionColumns;
  }, [compactMode, subscriptionColumns]);

  return (
    <Card
      title={
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
          <div className='flex items-center text-blue-500'>
            <CreditCard size={16} className='mr-2' />
            <Text>{t('订阅管理')}</Text>
          </div>

          <CompactModeToggle
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        </div>
      }
      extra={
        <SubscriptionsFilters
          t={t}
          loading={loading}
          loadSubscriptions={loadSubscriptions}
          handleOpenGrantModal={handleOpenGrantModal}
        />
      }
    >
      <CardTable
        columns={tableColumns}
        dataSource={subscriptions}
        loading={loading}
        scroll={compactMode ? undefined : { x: 'max-content' }}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: total,
          pageSizeOpts: [10, 20, 50],
          showSizeChanger: true,
          onPageChange: (page) => setActivePage(page),
          onPageSizeChange: (size) => {
            setPageSize(size);
            setActivePage(1);
          },
        }}
      />
    </Card>
  );
};

export default SubscriptionsTab;
