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

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Modal,
  Skeleton,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { ExternalLink, Layers, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API, getLobeHubIcon } from '../../helpers';
import {
  filterModelsByAllowedGroups,
  getSingleGroupPricingSearch,
} from './publicPlanModels';
import './i18n';
import './PublicPlanModelsDialog.css';

const { Text } = Typography;
const PRICING_CACHE_TTL = 5 * 60 * 1000;

let pricingCache = null;
let pricingCacheAt = 0;
let pricingRequest = null;

async function getPricingData(force = false) {
  const now = Date.now();
  if (!force && pricingCache && now - pricingCacheAt < PRICING_CACHE_TTL) {
    return pricingCache;
  }

  if (!force && pricingRequest) return pricingRequest;

  pricingRequest = API.get('/api/pricing', { skipErrorHandler: true })
    .then((res) => {
      const payload = res?.data;
      if (!payload?.success) {
        throw new Error(payload?.message || 'Unable to load pricing');
      }
      pricingCache = payload;
      pricingCacheAt = Date.now();
      return payload;
    })
    .finally(() => {
      pricingRequest = null;
    });

  return pricingRequest;
}

function getPricingLink(params) {
  return `/pricing${params || ''}`;
}

function getModelPricingSearch(model, groups) {
  const params = new URLSearchParams();
  if (model?.model_name) params.set('model', model.model_name);

  const modelGroups = Array.isArray(model?.enable_groups)
    ? model.enable_groups
    : [];
  const matchedGroup = groups.find((group) => modelGroups.includes(group));
  if (matchedGroup) params.set('group', matchedGroup);
  else if (groups.length === 1) params.set('group', groups[0]);

  const search = params.toString();
  return search ? `?${search}` : '';
}

function ModelIcon({ model }) {
  const iconName = model?.icon || model?.vendor_icon;

  return (
    <span className='classic-plan-model-icon'>
      {iconName ? (
        getLobeHubIcon(iconName, 22)
      ) : (
        <span className='classic-plan-model-initial'>
          {model?.model_name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </span>
  );
}

function ModelRow({ model, groups }) {
  const { t } = useTranslation();
  const search = getModelPricingSearch(model, groups);

  return (
    <a className='classic-plan-model-row' href={getPricingLink(search)}>
      <ModelIcon model={model} />
      <span className='classic-plan-model-main'>
        <span className='classic-plan-model-name'>{model.model_name}</span>
        <span className='classic-plan-model-vendor'>
          {model.vendor_name || t('未知供应商')}
        </span>
      </span>
      <ExternalLink size={14} className='classic-plan-model-arrow' />
    </a>
  );
}

function LoadingRows() {
  return (
    <div className='classic-plan-model-list'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='classic-plan-model-skeleton'>
          <Skeleton.Avatar active size='small' />
          <div className='classic-plan-model-skeleton-copy'>
            <Skeleton.Title active style={{ width: '46%', height: 16 }} />
            <Skeleton.Paragraph active rows={1} style={{ marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicPlanModelsDialog({ open, onOpenChange, title, groups }) {
  const { t } = useTranslation();
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const groupsKey = groups.join(',');
  const pricingSearch = getSingleGroupPricingSearch(groups);

  const loadModels = async (force = false) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPricingData(force);
      setPricingData(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && groups.length > 0) {
      loadModels();
    }
  }, [open, groupsKey]);

  const models = useMemo(() => {
    const data = pricingData;
    if (!data?.data) return [];

    const vendorMap = new Map(
      (data.vendors || []).map((vendor) => [vendor.id, vendor]),
    );
    const enriched = data.data.map((model) => {
      const vendor = model.vendor_id ? vendorMap.get(model.vendor_id) : null;
      return {
        ...model,
        vendor_name: vendor?.name,
        vendor_icon: vendor?.icon,
        vendor_description: vendor?.description,
      };
    });

    return filterModelsByAllowedGroups(enriched, groups);
  }, [pricingData, groupsKey]);

  const footer = (
    <div className='classic-plan-model-footer'>
      <Button theme='borderless' onClick={() => onOpenChange(false)}>
        {t('关闭')}
      </Button>
      <Button
        theme='solid'
        type='primary'
        icon={<ExternalLink size={14} />}
        onClick={() => {
          window.location.href = getPricingLink(pricingSearch);
        }}
      >
        {pricingSearch ? t('在模型广场查看') : t('打开模型广场')}
      </Button>
    </div>
  );

  return (
    <Modal
      title={
        <span className='classic-plan-model-title'>
          <Layers size={18} />
          {t('支持的模型')}
        </span>
      }
      visible={open}
      onCancel={() => onOpenChange(false)}
      footer={footer}
      width={720}
      centered
      closeOnEsc
      maskClosable
      className='classic-plan-model-modal'
    >
      <Text type='tertiary' className='classic-plan-model-description'>
        {t('{{plan}} 可使用的模型', { plan: title })}
      </Text>

      <div className='classic-plan-model-groups'>
        {groups.map((group) => (
          <a
            key={group}
            href={getPricingLink(`?group=${encodeURIComponent(group)}`)}
          >
            <Tag color='blue' shape='circle'>
              {group}
            </Tag>
          </a>
        ))}
      </div>

      <div className='classic-plan-model-body'>
        {loading ? (
          <LoadingRows />
        ) : error ? (
          <div className='classic-plan-model-empty'>
            <Empty
              description={
                <span>
                  <Text strong>{t('无法加载可用模型')}</Text>
                  <Text
                    type='tertiary'
                    className='classic-plan-model-empty-desc'
                  >
                    {t('请刷新页面后重试。')}
                  </Text>
                </span>
              }
            />
            <Button
              theme='outline'
              type='primary'
              icon={<RefreshCw size={14} />}
              onClick={() => loadModels(true)}
            >
              {t('刷新')}
            </Button>
          </div>
        ) : models.length === 0 ? (
          <div className='classic-plan-model-empty'>
            <Empty
              description={
                <span>
                  <Text strong>{t('暂未找到可用模型')}</Text>
                  <Text
                    type='tertiary'
                    className='classic-plan-model-empty-desc'
                  >
                    {t('当前允许分组下暂无已启用模型。')}
                  </Text>
                </span>
              }
            />
          </div>
        ) : (
          <div className='classic-plan-model-list'>
            {models.map((model) => (
              <ModelRow key={model.model_name} model={model} groups={groups} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
