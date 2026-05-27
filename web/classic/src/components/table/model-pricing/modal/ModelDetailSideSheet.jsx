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

import React, { useState } from 'react';
import { SideSheet, Typography, Button, Divider, TabPane, Tabs } from '@douyinfe/semi-ui';
import { IconClose } from '@douyinfe/semi-icons';

import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import ModelHeader from './components/ModelHeader';
import ModelBasicInfo from './components/ModelBasicInfo';
import ModelEndpoints from './components/ModelEndpoints';
import ModelPricingTable from './components/ModelPricingTable';
import DynamicPricingBreakdown from './components/DynamicPricingBreakdown';
import ModelPerformancePanel from '../../../health/ModelPerformancePanel';

const { Text } = Typography;

const ModelDetailSideSheet = ({
  visible,
  onClose,
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  vendorsMap,
  endpointMap,
  autoGroups,
  t,
  groupModelBilling = {},
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <SideSheet
      placement='right'
      title={
        <ModelHeader modelData={modelData} vendorsMap={vendorsMap} t={t} />
      }
      bodyStyle={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--semi-color-border)',
      }}
      visible={visible}
      width={isMobile ? '100%' : 600}
      closeIcon={
        <Button
          className='semi-button-tertiary semi-button-size-small semi-button-borderless'
          type='button'
          icon={<IconClose />}
          onClick={onClose}
        />
      }
      onCancel={onClose}
    >
      <div style={{ paddingTop: 16, paddingBottom: 16 }}>
        {!modelData && (
          <div className='flex justify-center items-center py-10'>
            <Text type='secondary'>{t('加载中...')}</Text>
          </div>
        )}
        {modelData && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ padding: '0 24px' }}
          >
            <TabPane tab={t('概览')} itemKey='overview'>
              <div style={{ paddingTop: 12 }}>
                <ModelBasicInfo
                  modelData={modelData}
                  vendorsMap={vendorsMap}
                  t={t}
                />
              </div>
              <Divider margin={16} />
              <ModelEndpoints
                modelData={modelData}
                endpointMap={endpointMap}
                t={t}
              />
              {modelData.billing_mode === 'tiered_expr' && modelData.billing_expr && (
                <>
                  <Divider margin={16} />
                  <DynamicPricingBreakdown
                    billingExpr={modelData.billing_expr}
                    t={t}
                  />
                </>
              )}
              <Divider margin={16} />
              <ModelPricingTable
                modelData={modelData}
                groupRatio={groupRatio}
                currency={currency}
                siteDisplayType={siteDisplayType}
                tokenUnit={tokenUnit}
                displayPrice={displayPrice}
                showRatio={showRatio}
                usableGroup={usableGroup}
                autoGroups={autoGroups}
                t={t}
                groupModelBilling={groupModelBilling}
              />
            </TabPane>
            <TabPane tab={t('性能')} itemKey='performance'>
              <div style={{ paddingTop: 12 }}>
                <ModelPerformancePanel modelName={modelData.model_name} />
              </div>
            </TabPane>
          </Tabs>
        )}
      </div>
    </SideSheet>
  );
};

export default ModelDetailSideSheet;
