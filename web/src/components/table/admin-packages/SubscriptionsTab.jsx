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
import { Card, Table } from '@douyinfe/semi-ui';
import { getSubscriptionsColumns } from './SubscriptionsColumnDefs';
import SubscriptionsFilters from './SubscriptionsFilters';

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

  return (
    <Card
      title={t('订阅管理')}
      extra={
        <SubscriptionsFilters
          t={t}
          loading={loading}
          loadSubscriptions={loadSubscriptions}
          handleOpenGrantModal={handleOpenGrantModal}
        />
      }
    >
      <Table
        columns={subscriptionColumns}
        dataSource={subscriptions}
        loading={loading}
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
