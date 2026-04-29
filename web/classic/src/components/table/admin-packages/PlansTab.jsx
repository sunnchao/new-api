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
import { Package } from 'lucide-react';
import { getPlansColumns } from './PlansColumnDefs';
import PlansFilters from './PlansFilters';
import CardTable from '../../common/ui/CardTable';
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const PlansTab = ({
  t,
  plans,
  loading,
  loadPlans,
  openPlanModal,
  handleDeletePlan,
  formatQuotaLimit,
  compactMode,
  setCompactMode,
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

  const { Text } = Typography;

  const tableColumns = useMemo(() => {
    return compactMode
      ? planColumns.map((col) => {
          if (col.dataIndex === 'operate') {
            const { fixed, ...rest } = col;
            return rest;
          }
          return col;
        })
      : planColumns;
  }, [compactMode, planColumns]);

  return (
    <Card
      title={
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
          <div className='flex items-center text-blue-500'>
            <Package size={16} className='mr-2' />
            <Text>{t('套餐管理')}</Text>
          </div>

          <CompactModeToggle
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        </div>
      }
      headerExtraContent={
        <PlansFilters
          t={t}
          loading={loading}
          loadPlans={loadPlans}
          openPlanModal={openPlanModal}
        />
      }
    >
      <CardTable
        columns={tableColumns}
        dataSource={plans}
        loading={loading}
        pagination={false}
        scroll={compactMode ? undefined : { x: 'max-content' }}
      />
    </Card>
  );
};

export default PlansTab;
