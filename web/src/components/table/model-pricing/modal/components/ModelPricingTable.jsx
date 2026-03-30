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
import { Card, Avatar, Typography, Table, Tag } from '@douyinfe/semi-ui';
import { IconCoinMoneyStroked } from '@douyinfe/semi-icons';
import { calculateModelPrice, getModelPriceItems } from '../../../../../helpers';
import {
  formatTierPricingTokenRange,
  getMatchedTierPricingRules,
} from '../../tierPricingUtils';

const { Text } = Typography;

const ModelPricingTable = ({
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  autoGroups = [],
  t,
  tierPricingConfig,
  groupModelBilling = {},
}) => {
  const modelEnableGroups = Array.isArray(modelData?.enable_groups)
    ? modelData.enable_groups
    : [];
  const availableGroups =
    modelEnableGroups.length > 0 ? modelEnableGroups : Object.keys(groupRatio || {});
  const autoChain = autoGroups.filter((group) => modelEnableGroups.includes(group));
  const matchedTierPricing = useMemo(
    () =>
      getMatchedTierPricingRules({
        modelName: modelData?.model_name,
        tierPricingConfig,
      }),
    [modelData?.model_name, tierPricingConfig],
  );

  const renderTierPricingSummary = (effectiveQuotaType) => {
    if (effectiveQuotaType !== 0 || matchedTierPricing.length === 0) {
      return null;
    }

    return (
      <div
        className='mt-3 rounded-lg px-3 py-2 space-y-2'
        style={{ backgroundColor: 'var(--semi-color-fill-0)' }}
      >
        {/* 详细阶梯计费说明只在详情弹窗的价格摘要中展开，并按当前分组的实际计费类型判断是否展示。 */}
        <div>
          <div className='text-xs font-semibold text-gray-700'>{t('阶梯计费')}</div>
          <div className='text-xs text-gray-500'>
            {t('按输入 Token 数量分段计费')}
          </div>
        </div>
        <div className='space-y-2'>
          {matchedTierPricing.map((tier, index) => (
            <div key={tier.id || index} className='space-y-1'>
              <Tag color='cyan' size='small' shape='circle'>
                {formatTierPricingTokenRange(
                  tier.min_prompt_tokens,
                  tier.max_prompt_tokens,
                )}
              </Tag>
              <div className='text-xs text-gray-600'>
                {t('输入')} {tier.input_price_multiplier}x · {t('输出')}{' '}
                {tier.output_price_multiplier}x · {t('缓存')}{' '}
                {tier.cache_read_price_multiplier ?? 1}x
              </div>
            </div>
          ))}
        </div>
        <div className='text-xs text-gray-500'>
          {t('超过阈值后，整个请求按对应倍率计费')}
        </div>
      </div>
    );
  };

  const renderGroupPriceTable = () => {
    const tableData = availableGroups.map((group) => {
      const priceData = modelData
        ? calculateModelPrice({
            record: modelData,
            selectedGroup: group,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
            groupModelBilling,
          })
        : { inputPrice: '-', outputPrice: '-', price: '-' };

      const groupRatioValue = groupRatio && groupRatio[group] ? groupRatio[group] : 1;
      const effectiveQuotaType =
        priceData?.effectiveQuotaType ?? modelData?.quota_type;

      return {
        key: group,
        group,
        ratio: groupRatioValue,
        effectiveQuotaType,
        billingType:
          effectiveQuotaType === 0
            ? t('按量计费')
            : effectiveQuotaType === 1
              ? t('按次计费')
              : '-',
        priceItems: getModelPriceItems(priceData, t, siteDisplayType),
      };
    });

    const columns = [
      {
        title: t('分组'),
        dataIndex: 'group',
        render: (text) => {
          const label = usableGroup?.[text] || text;
          return (
            <Tag color='white' size='small' shape='circle'>
              {label}
            </Tag>
          );
        },
      },
    ];

    if (showRatio) {
      columns.push({
        title: t('倍率'),
        dataIndex: 'ratio',
        render: (text) => (
          <Tag color='white' size='small' shape='circle'>
            {text}x
          </Tag>
        ),
      });
    }

    columns.push({
      title: t('计费类型'),
      dataIndex: 'billingType',
      render: (text) => {
        let color = 'white';
        if (text === t('按量计费')) {
          color = 'violet';
        } else if (text === t('按次计费')) {
          color = 'teal';
        }
        return (
          <Tag color={color} size='small' shape='circle'>
            {text || '-'}
          </Tag>
        );
      },
    });

    columns.push({
      title: siteDisplayType === 'TOKENS' ? t('计费摘要') : t('价格摘要'),
      dataIndex: 'priceItems',
      render: (items, record) => (
        <div className='space-y-1'>
          {items.map((item) => (
            <div key={item.key}>
              <div className='font-semibold text-orange-600'>
                {item.label} {item.value}
              </div>
              <div className='text-xs text-gray-500'>{item.suffix}</div>
            </div>
          ))}
          {renderTierPricingSummary(record.effectiveQuotaType)}
        </div>
      ),
    });

    return (
      <Table
        dataSource={tableData}
        columns={columns}
        pagination={false}
        size='small'
        bordered={false}
        className='!rounded-lg'
      />
    );
  };

  return (
    <Card className='!rounded-2xl shadow-sm border-0'>
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='orange' className='mr-2 shadow-md'>
          <IconCoinMoneyStroked size={16} />
        </Avatar>
        <div>
          <Text className='text-lg font-medium'>{t('分组价格')}</Text>
          <div className='text-xs text-gray-600'>
            {t('不同用户分组的价格信息')}
          </div>
        </div>
      </div>

      {autoChain.length > 0 ? (
        <div className='flex flex-wrap items-center gap-1 mb-4'>
          <span className='text-sm text-gray-600'>{t('auto分组调用链路')}</span>
          <span className='text-sm'>-&gt;</span>
          {autoChain.map((group, index) => (
            <React.Fragment key={group}>
              <Tag color='white' size='small' shape='circle'>
                {usableGroup?.[group] || group}
              </Tag>
              {index < autoChain.length - 1 ? (
                <span className='text-sm'>-&gt;</span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {renderGroupPriceTable()}
    </Card>
  );
};

export default ModelPricingTable;
