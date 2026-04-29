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
import { Tag } from '@douyinfe/semi-ui';
import { IconLayers } from '@douyinfe/semi-icons';
import { getMatchedTierPricingRules } from '../../tierPricingUtils';

const TierPricingBadge = ({ modelName, tierPricingConfig, t }) => {
  const matchedTiers = useMemo(() => {
    return getMatchedTierPricingRules({
      modelName,
      tierPricingConfig,
    });
  }, [modelName, tierPricingConfig]);

  if (matchedTiers.length === 0) {
    return null;
  }

  return (
    <Tag color='cyan' size='small' shape='circle'>
      <IconLayers size='small' style={{ marginRight: 2 }} />
      {t('阶梯计费')}
    </Tag>
  );
};

export default TierPricingBadge;
