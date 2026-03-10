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
import { Tag, Tooltip, Popover, Typography } from '@douyinfe/semi-ui';
import { IconLayers } from '@douyinfe/semi-icons';

const { Text } = Typography;

const formatTokens = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
};

const formatTokenRange = (min, max) => {
  if (max === 0) {
    return `>${formatTokens(min)}`;
  }
  if (min === 0) {
    return `≤${formatTokens(max)}`;
  }
  return `${formatTokens(min)}-${formatTokens(max)}`;
};

const TierPricingBadge = ({ modelName, tierPricingConfig, t }) => {
  const matchedTiers = useMemo(() => {
    if (!tierPricingConfig?.enabled || !tierPricingConfig?.rules?.length) {
      return [];
    }

    const normalizedModel = modelName?.toLowerCase() || '';
    
    // Find all rules matching this model
    const matched = tierPricingConfig.rules.filter((rule) => {
      if (!rule.enabled) return false;
      
      const patterns = rule.model_patterns || [rule.model_pattern];
      return patterns.some((pattern) => {
        if (!pattern) return false;
        const trimmed = pattern.trim().toLowerCase();
        if (trimmed === '*') return true;
        if (trimmed.endsWith('*')) {
          const prefix = trimmed.slice(0, -1);
          return normalizedModel.startsWith(prefix);
        }
        return normalizedModel === trimmed;
      });
    });

    // Group by model_pattern and sort by min_prompt_tokens
    const grouped = {};
    matched.forEach((rule) => {
      const pattern = rule.model_pattern || rule.model_patterns?.[0] || 'default';
      if (!grouped[pattern]) {
        grouped[pattern] = [];
      }
      grouped[pattern].push(rule);
    });

    // Sort each group by min_prompt_tokens
    Object.values(grouped).forEach((rules) => {
      rules.sort((a, b) => a.min_prompt_tokens - b.min_prompt_tokens);
    });

    // Flatten back to array (take first group if multiple patterns match)
    const firstPattern = Object.keys(grouped)[0];
    return firstPattern ? grouped[firstPattern] : [];
  }, [modelName, tierPricingConfig]);

  if (matchedTiers.length === 0) {
    return null;
  }

  const tierContent = (
    <div style={{ padding: '8px 0', minWidth: 280 }}>
      <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--semi-color-border)' }}>
        <Text strong style={{ fontSize: 13 }}>
          {t('阶梯计费')}
        </Text>
        <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
          {t('按输入 Token 数量分段计费')}
        </Text>
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: 'var(--semi-color-text-2)' }}>
            <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>
              {t('输入范围')}
            </th>
            <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 500 }}>
              {t('输入')}
            </th>
            <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 500 }}>
              {t('输出')}
            </th>
            <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 500 }}>
              {t('缓存')}
            </th>
          </tr>
        </thead>
        <tbody>
          {matchedTiers.map((tier, idx) => (
            <tr
              key={tier.id || idx}
              style={{
                backgroundColor: idx % 2 === 0 ? 'var(--semi-color-fill-0)' : 'transparent',
              }}
            >
              <td style={{ padding: '6px 8px' }}>
                <Tag size="small" color="blue">
                  {formatTokenRange(tier.min_prompt_tokens, tier.max_prompt_tokens)}
                </Tag>
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                <Text
                  style={{
                    color: tier.input_price_multiplier > 1 ? 'var(--semi-color-warning)' : 'var(--semi-color-success)',
                    fontWeight: 500,
                  }}
                >
                  {tier.input_price_multiplier}x
                </Text>
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                <Text
                  style={{
                    color: tier.output_price_multiplier > 1 ? 'var(--semi-color-warning)' : 'var(--semi-color-success)',
                    fontWeight: 500,
                  }}
                >
                  {tier.output_price_multiplier}x
                </Text>
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                <Text
                  style={{
                    color: (tier.cache_read_price_multiplier ?? 1) > 1 ? 'var(--semi-color-warning)' : 'var(--semi-color-success)',
                    fontWeight: 500,
                  }}
                >
                  {tier.cache_read_price_multiplier ?? 1}x
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--semi-color-border)' }}>
        <Text type="tertiary" size="small">
          {t('超过阈值后，整个请求按对应倍率计费')}
        </Text>
      </div>
    </div>
  );

  return (
    <Popover
      content={tierContent}
      position="bottomLeft"
      trigger="hover"
      showArrow
    >
      <Tag
        color="cyan"
        size="small"
        shape="circle"
        style={{ cursor: 'pointer' }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconLayers size="small" style={{ marginRight: 2 }} />
        {t('阶梯')} ({matchedTiers.length})
      </Tag>
    </Popover>
  );
};

export default TierPricingBadge;
