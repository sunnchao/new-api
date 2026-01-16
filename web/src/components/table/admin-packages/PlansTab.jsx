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
import { getPlansColumns } from './PlansColumnDefs';
import PlansFilters from './PlansFilters';

const PlansTab = ({
  t,
  plans,
  loading,
  loadPlans,
  openPlanModal,
  handleDeletePlan,
  formatQuotaLimit,
}) => {
  const planColumns = useMemo(
    () =>
      getPlansColumns({
        t,
        openPlanModal,
        handleDeletePlan,
        formatQuotaLimit,
      }),
    [t, openPlanModal, handleDeletePlan, formatQuotaLimit],
  );

  return (
    <Card
      title={t('套餐管理')}
      headerExtraContent={
        <PlansFilters
          t={t}
          loading={loading}
          loadPlans={loadPlans}
          openPlanModal={openPlanModal}
        />
      }
    >
      <Table columns={planColumns} dataSource={plans} loading={loading} pagination={false} />
    </Card>
  );
};

export default PlansTab;
