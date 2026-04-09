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

import React from 'react';
import {
  Button,
  Modal,
  Space,
  Tag,
  Typography,
  Popover,
  Divider,
  Badge,
  Tooltip,
} from '@douyinfe/semi-ui';
import { renderQuota } from '../../../helpers';
import { convertUSDToCurrency } from '../../../helpers/render';
import {
  formatSubscriptionResetMode,
  formatSubscriptionQuotaLimitSummary,
  formatSubscriptionResetPeriod,
  getSubscriptionQuotaLimitItems,
  formatSubscriptionTotalValue,
  getSubscriptionTotalLabel,
  isRequestBasedSubscription,
} from '../../../helpers/subscriptionFormat';

const { Text } = Typography;

function formatDuration(plan, t) {
  if (!plan) return '';
  const u = plan.duration_unit || 'month';
  if (u === 'custom') {
    return `${t('自定义')} ${plan.custom_seconds || 0}s`;
  }
  const unitMap = {
    year: t('年'),
    month: t('月'),
    day: t('日'),
    hour: t('小时'),
  };
  return `${plan.duration_value || 0}${unitMap[u] || u}`;
}

function parseAllowedGroups(value) {
  if (!value) return [];
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const renderPlanTitle = (text, record, t) => {
  const subtitle = record?.plan?.subtitle;
  const plan = record?.plan;
  const isRequestBilling = isRequestBasedSubscription(plan);
  const allowedGroups = parseAllowedGroups(plan?.allowed_groups);
  const popoverContent = (
    <div style={{ width: 260 }}>
      <Text strong>{text}</Text>
      {subtitle && (
        <Text type='tertiary' style={{ display: 'block', marginTop: 4 }}>
          {subtitle}
        </Text>
      )}
      <Divider margin={12} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Text type='tertiary'>{t('价格')}</Text>
        <Text strong style={{ color: 'var(--semi-color-success)' }}>
          {convertUSDToCurrency(Number(plan?.price_amount || 0), 2)}
        </Text>
        <Text type='tertiary'>{getSubscriptionTotalLabel(plan, t)}</Text>
        {plan?.total_amount > 0 ? (
          <Tooltip
            content={
              isRequestBilling
                ? `${plan.total_amount} ${t('次')}`
                : `${t('原生额度')}：${plan.total_amount}`
            }
          >
            <Text>
              {formatSubscriptionTotalValue(
                plan.total_amount,
                plan,
                t,
                renderQuota,
              )}
            </Text>
          </Tooltip>
        ) : (
          <Text>{t('不限')}</Text>
        )}
        <Text type='tertiary'>{t('升级分组')}</Text>
        <Text>{plan?.upgrade_group ? plan.upgrade_group : t('不升级')}</Text>
        <Text type='tertiary'>{t('指定分组')}</Text>
        <Text>
          {allowedGroups.length > 0 ? allowedGroups.join(', ') : t('所有分组')}
        </Text>
        <Text type='tertiary'>{t('购买上限')}</Text>
        <Text>
          {plan?.max_purchase_per_user > 0
            ? plan.max_purchase_per_user
            : t('不限')}
        </Text>
        <Text type='tertiary'>{t('有效期')}</Text>
        <Text>{formatDuration(plan, t)}</Text>
        <Text type='tertiary'>{t('重置')}</Text>
        <Text>{formatSubscriptionResetPeriod(plan, t)}</Text>
        <Text type='tertiary'>{t('额度限制')}</Text>
        <Text>
          {formatSubscriptionQuotaLimitSummary(plan, t, { maxItems: 2 })}
        </Text>
      </div>
    </div>
  );

  return (
    <Popover content={popoverContent} position='rightTop' showArrow>
      <div style={{ cursor: 'pointer', maxWidth: 180 }}>
        <Text strong ellipsis={{ showTooltip: false }}>
          {text}
        </Text>
        {subtitle && (
          <Text
            type='tertiary'
            ellipsis={{ showTooltip: false }}
            style={{ display: 'block' }}
          >
            {subtitle}
          </Text>
        )}
      </div>
    </Popover>
  );
};

const renderBillingMode = (text, record, t) => {
  const billingMode = record?.plan?.billing_mode || 'quota';
  return (
    <Tag color={billingMode === 'request' ? 'teal' : 'violet'} shape='circle'>
      {billingMode === 'request' ? t('按次计费') : t('按量计费')}
    </Tag>
  );
};

const renderPrice = (text) => {
  return (
    <Text strong style={{ color: 'var(--semi-color-success)' }}>
      {convertUSDToCurrency(Number(text || 0), 2)}
    </Text>
  );
};

const renderPurchaseLimit = (text, record, t) => {
  const limit = Number(record?.plan?.max_purchase_per_user || 0);
  return (
    <Text type={limit > 0 ? 'secondary' : 'tertiary'}>
      {limit > 0 ? limit : t('不限')}
    </Text>
  );
};

const renderDuration = (text, record, t) => {
  return <Text type='secondary'>{formatDuration(record?.plan, t)}</Text>;
};

const renderEnabled = (text, record, t) => {
  return text ? (
    <Tag
      color='white'
      shape='circle'
      type='light'
      prefixIcon={<Badge dot type='success' />}
    >
      {t('启用')}
    </Tag>
  ) : (
    <Tag
      color='white'
      shape='circle'
      type='light'
      prefixIcon={<Badge dot type='danger' />}
    >
      {t('禁用')}
    </Tag>
  );
};

const renderTotalAmount = (text, record, t) => {
  const total = Number(record?.plan?.total_amount || 0);
  const plan = record?.plan;
  const isRequestBilling = isRequestBasedSubscription(plan);
  return (
    <Text type={total > 0 ? 'secondary' : 'tertiary'}>
      {total > 0 ? (
        <Tooltip
          content={
            isRequestBilling
              ? `${total} ${t('次')}`
              : `${t('原生额度')}：${total}`
          }
        >
          <span>
            {formatSubscriptionTotalValue(total, plan, t, renderQuota)}
          </span>
        </Tooltip>
      ) : (
        t('不限')
      )}
    </Text>
  );
};

const renderUpgradeGroup = (text, record, t) => {
  const group = record?.plan?.upgrade_group || '';
  return (
    <Text type={group ? 'secondary' : 'tertiary'}>
      {group ? group : t('不升级')}
    </Text>
  );
};

const renderAllowedGroups = (text, record, t) => {
  const groups = parseAllowedGroups(record?.plan?.allowed_groups);
  if (groups.length === 0) {
    return <Text type='tertiary'>{t('所有分组')}</Text>;
  }
  return (
    <Space spacing={4} wrap>
      {groups.map((group) => (
        <Tag key={`${record?.plan?.id}-${group}`} size='small' color='cyan'>
          {group}
        </Tag>
      ))}
    </Space>
  );
};

const renderResetPeriod = (text, record, t) => {
  const period = record?.plan?.quota_reset_period || 'never';
  const isNever = period === 'never';
  return (
    <Text type={isNever ? 'tertiary' : 'secondary'}>
      {formatSubscriptionResetPeriod(record?.plan, t, { shortMode: true })}
    </Text>
  );
};

const renderQuotaLimits = (text, record, t) => {
  const plan = record?.plan;
  const items = getSubscriptionQuotaLimitItems(plan, t);
  if (items.length === 0) {
    return <Text type='tertiary'>{t('无')}</Text>;
  }

  const colorMap = {
    hourly: 'orange',
    daily: 'blue',
    weekly: 'green',
    monthly: 'purple',
  };

  const visibleItems = items.slice(0, 3);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        maxWidth: 220,
      }}
    >
      {visibleItems.map((item) => {
        const fullText = `${item.label} ${renderQuota(item.amount)}·${formatSubscriptionResetMode(item.mode, t, { short: true })}`;

        return (
          <Tag
            key={`${record?.id}-${item.key}`}
            size='small'
            color={colorMap[item.key] || 'grey'}
            type='light'
            shape='circle'
            style={{
              maxWidth: '100%',
              minWidth: 0,
              margin: 0,
            }}
          >
            <Text
              ellipsis={{ showTooltip: true }}
              style={{
                display: 'block',
                color: 'inherit',
                maxWidth: '100%',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {fullText}
            </Text>
          </Tag>
        );
      })}
      {hiddenCount > 0 && (
        <Tag size='small' color='grey' type='light' shape='circle'>
          +{hiddenCount}
        </Tag>
      )}
    </div>
  );
};

const renderPaymentConfig = (text, record, t, enableEpay) => {
  const hasStripe = !!record?.plan?.stripe_price_id;
  const hasCreem = !!record?.plan?.creem_product_id;
  const hasEpay = !!enableEpay;

  return (
    <Space spacing={4}>
      {hasStripe && (
        <Tag color='violet' shape='circle'>
          Stripe
        </Tag>
      )}
      {hasCreem && (
        <Tag color='cyan' shape='circle'>
          Creem
        </Tag>
      )}
      {hasEpay && (
        <Tag color='light-green' shape='circle'>
          {t('易支付')}
        </Tag>
      )}
    </Space>
  );
};

const renderOperations = (text, record, { openEdit, setPlanEnabled, t }) => {
  const isEnabled = record?.plan?.enabled;

  const handleToggle = () => {
    if (isEnabled) {
      Modal.confirm({
        title: t('确认禁用'),
        content: t('禁用后用户端不再展示，但历史订单不受影响。是否继续？'),
        centered: true,
        onOk: () => setPlanEnabled(record, false),
      });
    } else {
      Modal.confirm({
        title: t('确认启用'),
        content: t('启用后套餐将在用户端展示。是否继续？'),
        centered: true,
        onOk: () => setPlanEnabled(record, true),
      });
    }
  };

  return (
    <Space spacing={8}>
      <Button
        theme='light'
        type='tertiary'
        size='small'
        onClick={() => openEdit(record)}
      >
        {t('编辑')}
      </Button>
      {isEnabled ? (
        <Button theme='light' type='danger' size='small' onClick={handleToggle}>
          {t('禁用')}
        </Button>
      ) : (
        <Button
          theme='light'
          type='primary'
          size='small'
          onClick={handleToggle}
        >
          {t('启用')}
        </Button>
      )}
    </Space>
  );
};

export const getSubscriptionsColumns = ({
  t,
  openEdit,
  setPlanEnabled,
  enableEpay,
}) => {
  return [
    {
      title: 'ID',
      dataIndex: ['plan', 'id'],
      width: 60,
      render: (text) => <Text type='tertiary'>#{text}</Text>,
    },
    {
      title: t('套餐'),
      dataIndex: ['plan', 'title'],
      width: 200,
      render: (text, record) => renderPlanTitle(text, record, t),
    },
    {
      title: t('价格'),
      dataIndex: ['plan', 'price_amount'],
      width: 100,
      render: (text) => renderPrice(text),
    },
    {
      title: t('计费方式'),
      width: 100,
      render: (text, record) => renderBillingMode(text, record, t),
    },
    {
      title: t('购买上限'),
      width: 90,
      render: (text, record) => renderPurchaseLimit(text, record, t),
    },
    {
      title: t('优先级'),
      dataIndex: ['plan', 'sort_order'],
      width: 80,
      render: (text) => <Text type='tertiary'>{Number(text || 0)}</Text>,
    },
    {
      title: t('有效期'),
      width: 100,
      render: (text, record) => renderDuration(text, record, t),
    },
    {
      title: t('重置'),
      width: 120,
      render: (text, record) => renderResetPeriod(text, record, t),
    },
    {
      title: t('额度限制'),
      width: 240,
      render: (text, record) => renderQuotaLimits(text, record, t),
    },
    {
      title: t('状态'),
      dataIndex: ['plan', 'enabled'],
      width: 80,
      render: (text, record) => renderEnabled(text, record, t),
    },
    {
      title: t('支付渠道'),
      width: 180,
      render: (text, record) =>
        renderPaymentConfig(text, record, t, enableEpay),
    },
    {
      title: t('总额度'),
      width: 100,
      render: (text, record) => renderTotalAmount(text, record, t),
    },
    {
      title: t('升级分组'),
      width: 100,
      render: (text, record) => renderUpgradeGroup(text, record, t),
    },
    {
      title: t('指定分组'),
      width: 180,
      render: (text, record) => renderAllowedGroups(text, record, t),
    },
    {
      title: t('操作'),
      dataIndex: 'operate',
      fixed: 'right',
      width: 160,
      render: (text, record) =>
        renderOperations(text, record, { openEdit, setPlanEnabled, t }),
    },
  ];
};
