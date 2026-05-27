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
import { Button, Tag, Tooltip, Typography } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  Layers,
  ListTree,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCurrencyConfig, renderQuota } from '../../helpers/render';
import {
  formatSubscriptionDuration,
  formatSubscriptionResetPeriod,
  formatSubscriptionTotalValue,
  getSubscriptionQuotaLimitItems,
  getSubscriptionTotalLabel,
  isRequestBasedSubscription,
} from '../../helpers/subscriptionFormat';
import {
  buildSubscriptionCheckoutPath,
  buildSubscriptionLoginState,
} from '../../helpers/subscriptionRouting';
import { PublicPlanModelsDialog } from './PublicPlanModelsDialog';
import { parseAllowedGroups } from './publicPlanModels';
import './i18n';
import './PublicSubscriptionPlanCard.css';

const { Text, Title } = Typography;

function formatBillingMode(mode, t) {
  return mode === 'request' ? t('按次计费') : t('按量计费');
}

function formatQuotaLimitSummary(plan, t, options = {}) {
  const items = getSubscriptionQuotaLimitItems(plan, t);
  if (items.length === 0) return t('无');
  const max = options.maxItems || items.length;
  const segments = items.slice(0, max).map((item) => {
    const val = isRequestBasedSubscription(item)
      ? `${item.amount} ${t('次')}`
      : renderQuota(item.amount);
    return `${item.label} ${val}`;
  });
  if (items.length > max)
    segments.push(t('另 {{count}} 项', { count: items.length - max }));
  return segments.join(' / ');
}

export function PublicSubscriptionPlanCard({
  record,
  isAuthenticated,
  featured = false,
  actionOverride,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const plan = record?.plan;
  if (!plan) return null;

  const { symbol, rate } = getCurrencyConfig();
  const price = Number(plan.price_amount || 0);
  const convertedPrice = price * rate;
  const displayPrice = convertedPrice.toFixed(
    Number.isInteger(convertedPrice) ? 0 : 2,
  );

  const totalAmount = Number(plan.total_amount || 0);
  const allowedGroups = parseAllowedGroups(plan.allowed_groups);
  const purchaseLimit = Number(plan.max_purchase_per_user || 0);
  const isRequestBilling = isRequestBasedSubscription(plan);
  const limitSummary = formatQuotaLimitSummary(plan, t, { maxItems: 4 });
  const resetPeriod = formatSubscriptionResetPeriod(plan, t);
  const totalLabel =
    totalAmount > 0
      ? formatSubscriptionTotalValue(totalAmount, plan, t, renderQuota, {
          approximateTimes: Number(plan.approximate_times ?? 0),
        })
      : t('不限');

  const highlights = [
    {
      icon: Clock,
      label: t('有效期'),
      value: formatSubscriptionDuration(plan, t),
    },
    {
      icon: Layers,
      label: t('计费模式'),
      value: formatBillingMode(plan.billing_mode, t),
    },
    {
      icon: ShieldCheck,
      label: `${getSubscriptionTotalLabel(plan, t)}`,
      value: totalLabel,
    },
  ];

  const details = [
    resetPeriod !== t('不重置') ? `${t('额度重置')}: ${resetPeriod}` : null,
    limitSummary !== t('无') ? `${t('额度限制')}: ${limitSummary}` : null,
    plan.upgrade_group ? `${t('升级分组')}: ${plan.upgrade_group}` : null,
    purchaseLimit > 0 ? `${t('限购')}: ${purchaseLimit}` : null,
  ].filter(Boolean);

  const handleClick = () => {
    if (actionOverride?.onClick) {
      actionOverride.onClick();
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', {
        state: buildSubscriptionLoginState(plan.id),
      });
      return;
    }
    window.location.href = buildSubscriptionCheckoutPath(plan.id);
  };

  const buttonDisabled = actionOverride?.disabled;
  const buttonLabel = actionOverride
    ? t(actionOverride.labelKey)
    : t('立即订阅');
  const buttonTip = actionOverride?.disabledTooltip || '';

  const buttonEl = (
    <Button
      theme='solid'
      type='primary'
      block
      disabled={buttonDisabled}
      onClick={handleClick}
      className='classic-plan-card-button'
      icon={!buttonDisabled ? <ArrowRight size={14} /> : undefined}
      iconPosition='right'
    >
      {buttonLabel}
    </Button>
  );

  return (
    <>
      <article
        className={`classic-plan-card${featured ? ' is-featured' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className='classic-plan-card-header'>
          <div className='classic-plan-title-block'>
            <Title
              heading={4}
              ellipsis={{ rows: 1, showTooltip: true }}
              style={{ margin: 0 }}
            >
              {plan.title || t('订阅套餐')}
            </Title>
            {plan.subtitle && (
              <Text
                type='tertiary'
                size='small'
                ellipsis={{ rows: 2, showTooltip: true }}
                className='classic-plan-subtitle'
              >
                {plan.subtitle}
              </Text>
            )}
          </div>

          <Tag
            color={isRequestBilling ? 'teal' : 'blue'}
            shape='circle'
            className='classic-plan-mode-tag'
          >
            {formatBillingMode(plan.billing_mode, t)}
          </Tag>
        </div>

        <div className='classic-plan-price-row'>
          <div className='classic-plan-price'>
            <span className='classic-plan-symbol'>{symbol}</span>
            <span className='classic-plan-amount'>{displayPrice}</span>
          </div>
          {featured && (
            <span className='classic-plan-featured'>
              <Sparkles size={13} />
              {t('推荐')}
            </span>
          )}
        </div>

        <div className='classic-plan-highlights'>
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className='classic-plan-highlight'>
                <Icon size={15} className='classic-plan-highlight-icon' />
                <div className='classic-plan-highlight-text'>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {allowedGroups.length > 0 && (
          <div className='classic-plan-groups'>
            <Text type='tertiary' size='small'>
              {t('允许分组')}
            </Text>
            <div className='classic-plan-group-tags'>
              {allowedGroups.map((group) => (
                <Tag key={group} size='small'>
                  {group}
                </Tag>
              ))}
            </div>
            <Button
              size='small'
              icon={<ListTree size={14} />}
              onClick={() => setModelsOpen(true)}
              className='classic-plan-model-button'
            >
              {t('查看可用模型')}
            </Button>
          </div>
        )}

        {details.length > 0 && (
          <div className='classic-plan-details'>
            {details.map((detail) => (
              <div key={detail} className='classic-plan-detail'>
                <Check size={14} />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className='classic-plan-footer'>
          {buttonDisabled && buttonTip ? (
            <Tooltip content={buttonTip} position='top'>
              <div>{buttonEl}</div>
            </Tooltip>
          ) : (
            buttonEl
          )}
        </div>
      </article>

      {allowedGroups.length > 0 && (
        <PublicPlanModelsDialog
          open={modelsOpen}
          onOpenChange={setModelsOpen}
          title={plan.title || t('订阅套餐')}
          groups={allowedGroups}
        />
      )}
    </>
  );
}

export default PublicSubscriptionPlanCard;
