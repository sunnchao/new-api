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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  Popover,
  Progress,
  Divider,
  Badge,
  Tooltip,
} from '@douyinfe/semi-ui';
import { IconRefresh, IconSearch, IconFilter } from '@douyinfe/semi-icons';
import { API, renderQuota, showError, showSuccess } from '../../../helpers';
import CardTable from '../../common/ui/CardTable';
import { useTableCompactMode } from '../../../hooks/common/useTableCompactMode.js';
import {
  formatSubscriptionQuotaLimitItemText,
  formatSubscriptionResetMode,
  getSubscriptionQuotaLimitItems,
  getSubscriptionQuotaLimitTitle,
  getSubscriptionTotalLabel,
  getSubscriptionUsageMetrics,
  isRequestBasedSubscription,
} from '../../../helpers/subscriptionFormat';

const { Text } = Typography;

const getStatusConfig = (t) => ({
  active: { label: t('生效中'), color: 'green' },
  expired: { label: t('已过期'), color: 'grey' },
  cancelled: { label: t('已取消'), color: 'orange' },
  exhausted: { label: t('已耗尽'), color: 'red' },
});

const formatDate = (timestamp, language = 'zh') => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  const localeMap = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    fr: 'fr-FR',
    ru: 'ru-RU',
    vi: 'vi-VN',
  };
  const locale = localeMap[language] || 'zh-CN';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const LIMIT_COLOR_MAP = {
  hourly: 'orange',
  daily: 'blue',
  weekly: 'green',
  monthly: 'purple',
};

const getUsageStroke = (percent) => {
  if (percent > 90) return '#f82c55';
  if (percent > 70) return '#faae14';
  return '#6caf6f';
};

const SubscriptionOverviewPage = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || 'zh';
  const statusConfig = getStatusConfig(t);
  const [compactMode, setCompactMode] = useTableCompactMode(
    'subscriptionOverview',
  );

  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [usernameFilter, setUsernameFilter] = useState('');
  const [planIdFilter, setPlanIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Operations
  const [operatingId, setOperatingId] = useState(null);

  // Load plans for filter dropdown
  const loadPlans = useCallback(async () => {
    try {
      const res = await API.get('/api/subscription/admin/plans');
      if (res?.data?.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  }, []);

  // Load subscriptions
  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (usernameFilter) params.append('username', usernameFilter);
      if (planIdFilter) params.append('plan_id', planIdFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (groupFilter) params.append('user_group', groupFilter);

      const res = await API.get(
        `/api/subscription/admin/all?${params.toString()}`,
      );
      if (res?.data?.success) {
        const data = res.data.data || {};
        setSubscriptions(data.data || []);
        setTotal(data.total || 0);
      } else {
        showError(res?.data?.message || t('加载失败'));
      }
    } catch (err) {
      showError(err.message || t('加载失败'));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    usernameFilter,
    planIdFilter,
    statusFilter,
    groupFilter,
    t,
  ]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleSearch = useCallback(() => {
    setPage(1);
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleResetFilters = useCallback(() => {
    setUsernameFilter('');
    setPlanIdFilter('');
    setStatusFilter('');
    setGroupFilter('');
    setPage(1);
  }, []);

  // Cancel subscription
  const handleCancelSubscription = useCallback(
    async (record) => {
      Modal.confirm({
        title: t('确认取消订阅'),
        content: t('确定要取消这个订阅吗？'),
        onOk: async () => {
          setOperatingId(record.id);
          try {
            const res = await API.post(
              `/api/subscription/admin/user_subscriptions/${record.id}/invalidate`,
            );
            if (res?.data?.success) {
              showSuccess(t('取消成功'));
              await loadSubscriptions();
            } else {
              showError(res?.data?.message || t('取消失败'));
            }
          } catch (err) {
            showError(err.message || t('取消失败'));
          } finally {
            setOperatingId(null);
          }
        },
      });
    },
    [loadSubscriptions, t],
  );

  // Delete subscription
  const handleDeleteSubscription = useCallback(
    async (record) => {
      Modal.confirm({
        title: t('确认删除订阅'),
        content: t('确定要删除这个订阅吗？此操作不可恢复。'),
        onOk: async () => {
          setOperatingId(record.id);
          try {
            const res = await API.delete(
              `/api/subscription/admin/user_subscriptions/${record.id}`,
            );
            if (res?.data?.success) {
              showSuccess(t('删除成功'));
              await loadSubscriptions();
            } else {
              showError(res?.data?.message || t('删除失败'));
            }
          } catch (err) {
            showError(err.message || t('删除失败'));
          } finally {
            setOperatingId(null);
          }
        },
      });
    },
    [loadSubscriptions, t],
  );

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: t('用户ID'),
        dataIndex: 'user_id',
        width: 80,
        render: (userId) => <Text type='tertiary'>{userId}</Text>,
      },
      {
        title: t('用户'),
        dataIndex: 'username',
        render: (_, record) => (
          <div>
            <Text strong>{record.username || '-'}</Text>
            {record.user_display_name && (
              <Text type='secondary' size='small' className='ml-1'>
                ({record.user_display_name})
              </Text>
            )}
            <div className='text-xs text-gray-500'>
              {record.user_email || '-'}
            </div>
          </div>
        ),
      },
      {
        title: t('用户分组'),
        dataIndex: 'user_group',
        width: 100,
        render: (text) => <Tag size='small'>{text || 'default'}</Tag>,
      },
      {
        title: t('套餐'),
        dataIndex: 'plan_title',
        render: (text, record) => (
          <div>
            <Text>{text || '-'}</Text>
            <div className='text-xs text-gray-500'>ID: {record.plan_id}</div>
          </div>
        ),
      },
      {
        title: t('状态'),
        dataIndex: 'status',
        width: 90,
        render: (status) => {
          const config = statusConfig[status] || {
            label: status,
            color: 'grey',
          };
          return <Tag color={config.color}>{config.label}</Tag>;
        },
      },
      {
        title: t('计费模式'),
        dataIndex: 'billing_mode',
        width: 90,
        render: (mode) => (
          <Tag
            size='small'
            color={mode === 'request' ? 'teal' : 'violet'}
            shape='circle'
          >
            {mode === 'request' ? t('按次计费') : t('按量计费')}
          </Tag>
        ),
      },
      {
        title: t('额度'),
        width: 220,
        render: (_, record) => {
          const metrics = getSubscriptionUsageMetrics(
            {
              used: record.amount_used,
              total: record.amount_total,
            },
            record,
            t,
            renderQuota,
          );
          const approximateTimes = Number(record.approximate_times || 0);
          const approximateTimesUsed = Number(
            record.approximate_times_used || 0,
          );
          const totalLabel = getSubscriptionTotalLabel(record, t);
          const isRequestBilling = isRequestBasedSubscription(record);

          const popoverContent = (
            <div style={{ width: 280 }}>
              <div className='flex items-center justify-between gap-3'>
                <Text strong>{totalLabel}</Text>
                <Tag
                  size='small'
                  color={isRequestBilling ? 'teal' : 'violet'}
                  shape='circle'
                >
                  {isRequestBilling ? t('按次计费') : t('按量计费')}
                </Tag>
              </div>
              <Divider margin={12} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '88px 1fr',
                  gap: '8px 12px',
                }}
              >
                <Text type='tertiary'>{totalLabel}</Text>
                <Text>
                  {metrics.isUnlimited ? t('不限') : metrics.totalText}
                </Text>
                <Text type='tertiary'>{t('已用')}</Text>
                <Text>{metrics.usedText}</Text>
                <Text type='tertiary'>{t('剩余')}</Text>
                <Text>
                  {metrics.isUnlimited ? t('不限') : metrics.remainText}
                </Text>
                {!metrics.isUnlimited && (
                  <>
                    <Text type='tertiary'>{t('进度')}</Text>
                    <Text>{metrics.percent}%</Text>
                  </>
                )}
                {!isRequestBilling && approximateTimes > 0 && (
                  <>
                    <Text type='tertiary'>{t('预估次数')}</Text>
                    <Text>
                      {approximateTimesUsed}/{approximateTimes}
                    </Text>
                  </>
                )}
              </div>
            </div>
          );

          if (metrics.isUnlimited) {
            return (
              <Popover content={popoverContent} position='rightTop' showArrow>
                <div className='text-sm cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <Tag size='small' color='grey' type='light' shape='circle'>
                      {t('不限')}
                    </Tag>
                    <Text type='tertiary' size='small'>
                      {t('已用')} {metrics.usedText}
                    </Text>
                  </div>
                </div>
              </Popover>
            );
          }

          return (
            <Popover content={popoverContent} position='rightTop' showArrow>
              <div className='text-sm cursor-pointer' style={{ maxWidth: 200 }}>
                <div className='flex items-center gap-1 min-w-0'>
                  <Tooltip
                    content={`${metrics.remainText}/${metrics.totalText}`}
                  >
                    <Text strong ellipsis={{ showTooltip: false }}>
                      {metrics.remainText}
                    </Text>
                  </Tooltip>
                  <Text type='tertiary' size='small'>
                    / {metrics.totalText}
                  </Text>
                  <Tag
                    size='small'
                    color='grey'
                    type='light'
                    shape='circle'
                    style={{ margin: 0 }}
                  >
                    {metrics.percent}%
                  </Tag>
                </div>
                <Progress
                  percent={metrics.percent}
                  size='small'
                  showInfo={false}
                  style={{ marginTop: 4 }}
                  stroke={getUsageStroke(metrics.percent)}
                />
              </div>
            </Popover>
          );
        },
      },
      {
        title: t('额度限制'),
        width: 260,
        render: (_, record) => {
          const limitItems = getSubscriptionQuotaLimitItems(record, t);
          if (limitItems.length === 0) {
            return <Text type='tertiary'>{t('无限制')}</Text>;
          }

          const itemsWithMetrics = limitItems.map((item) => ({
            item,
            metrics: getSubscriptionUsageMetrics(
              {
                used: item.used,
                total: item.amount,
              },
              item,
              t,
              renderQuota,
            ),
          }));
          const visibleItems = itemsWithMetrics.slice(0, 3);
          const hiddenCount = itemsWithMetrics.length - visibleItems.length;

          return (
            <Popover
              content={
                <div style={{ width: 300 }}>
                  <div className='flex items-center gap-2 mb-2'>
                    <Text strong>
                      {getSubscriptionQuotaLimitTitle(record, t)}
                    </Text>
                    <Tag color='orange' size='small' shape='circle'>
                      {limitItems.length} {t('项')}
                    </Tag>
                  </div>
                  <Space vertical spacing={10} style={{ width: '100%' }}>
                    {itemsWithMetrics.map(({ item, metrics }) => (
                      <div key={`${record.id}-${item.key}`}>
                        <div className='flex items-center justify-between gap-3 mb-1'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <Badge dot type='warning' />
                            <Text ellipsis={{ showTooltip: true }}>
                              {item.label}
                            </Text>
                            <Tag size='small' color='white' shape='circle'>
                              {formatSubscriptionResetMode(item.mode, t, {
                                short: true,
                              })}
                            </Tag>
                          </div>
                          <Text type='secondary' size='small'>
                            {metrics.remainText}/{metrics.totalText}
                          </Text>
                        </div>
                        <Progress
                          percent={metrics.percent}
                          size='small'
                          showInfo={false}
                          stroke={getUsageStroke(metrics.percent)}
                        />
                        <div className='mt-1 text-xs text-gray-500'>
                          <span>
                            {t('已用')} {metrics.usedText}
                          </span>
                          <span className='mx-2'>·</span>
                          <span>
                            {t('剩余')} {metrics.remainText}
                          </span>
                          {item.nextResetTime > 0 && (
                            <>
                              <span className='mx-2'>·</span>
                              <span>
                                {t('下一次重置')}{' '}
                                {formatDate(
                                  item.nextResetTime,
                                  currentLanguage,
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              }
              position='rightTop'
              showArrow
            >
              <div
                className='cursor-pointer'
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                  maxWidth: 240,
                }}
              >
                {visibleItems.map(({ item, metrics }) => {
                  const fullText = formatSubscriptionQuotaLimitItemText(
                    item,
                    t,
                    renderQuota,
                  );
                  const tagText = `${item.label} ${metrics.remainText}/${metrics.totalText}`;
                  return (
                    <Tag
                      key={`${record.id}-${item.key}`}
                      size='small'
                      color={LIMIT_COLOR_MAP[item.key] || 'grey'}
                      type='light'
                      shape='circle'
                      style={{
                        maxWidth: '100%',
                        minWidth: 0,
                        margin: 0,
                      }}
                    >
                      <Tooltip
                        content={`${fullText} · ${t('已用')} ${metrics.usedText}`}
                      >
                        <Text
                          ellipsis={{ showTooltip: false }}
                          style={{
                            display: 'block',
                            color: 'inherit',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tagText}
                        </Text>
                      </Tooltip>
                    </Tag>
                  );
                })}
                {hiddenCount > 0 && (
                  <Tag size='small' color='grey' type='light' shape='circle'>
                    +{hiddenCount}
                  </Tag>
                )}
              </div>
            </Popover>
          );
        },
      },
      {
        title: t('分组权限'),
        render: (_, record) => {
          const allowedGroups = record.allowed_groups || '';
          if (!allowedGroups) {
            return (
              <Tag color='green' size='small'>
                {t('所有分组')}
              </Tag>
            );
          }
          const groups = allowedGroups
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean);
          if (groups.length <= 2) {
            return (
              <Space size='small'>
                {groups.map((g, idx) => (
                  <Tag key={idx} color='cyan' size='small'>
                    {g}
                  </Tag>
                ))}
              </Space>
            );
          }
          return (
            <Popover
              content={
                <Space size='small'>
                  {groups.map((g, idx) => (
                    <Tag key={idx} color='cyan' size='small'>
                      {g}
                    </Tag>
                  ))}
                </Space>
              }
              trigger='hover'
            >
              <Tag color='cyan' size='small'>
                {groups.length} {t('个分组')}
              </Tag>
            </Popover>
          );
        },
      },
      {
        title: t('开始时间'),
        dataIndex: 'start_time',
        width: 150,
        render: (timestamp) => formatDate(timestamp, currentLanguage),
      },
      {
        title: t('结束时间'),
        dataIndex: 'end_time',
        width: 150,
        render: (timestamp) => formatDate(timestamp, currentLanguage),
      },
      {
        title: t('操作'),
        dataIndex: 'operate',
        fixed: 'right',
        width: 120,
        render: (_, record) => (
          <Space>
            <Button
              type='danger'
              size='small'
              disabled={
                record.status === 'expired' ||
                record.status === 'cancelled' ||
                operatingId === record.id
              }
              loading={operatingId === record.id}
              onClick={() => handleCancelSubscription(record)}
            >
              {t('取消')}
            </Button>
            <Button
              type='danger'
              size='small'
              loading={operatingId === record.id}
              onClick={() => handleDeleteSubscription(record)}
            >
              {t('删除')}
            </Button>
          </Space>
        ),
      },
    ];

    if (compactMode) {
      return baseColumns.map((col) => {
        if (col.fixed === 'right') {
          const { fixed, ...rest } = col;
          return rest;
        }
        return col;
      });
    }

    return baseColumns;
  }, [
    t,
    statusConfig,
    currentLanguage,
    compactMode,
    operatingId,
    handleCancelSubscription,
    handleDeleteSubscription,
  ]);

  const planOptions = useMemo(
    () => [
      { label: t('全部套餐'), value: '' },
      ...plans.map((p) => ({
        label: p.plan?.title || p.title || `Plan ${p.plan?.id || p.id}`,
        value: String(p.plan?.id || p.id),
      })),
    ],
    [plans, t],
  );

  const statusOptions = useMemo(
    () => [
      { label: t('全部状态'), value: '' },
      { label: t('生效中'), value: 'active' },
      { label: t('已过期'), value: 'expired' },
      { label: t('已取消'), value: 'cancelled' },
    ],
    [t],
  );

  return (
    <Card
      title={
        <div className='flex items-center gap-2'>
          <Text className='text-blue-500 font-medium'>{t('用户订阅')}</Text>
          <Text type='secondary' size='small'>
            ({t('共')} {total} {t('条')})
          </Text>
        </div>
      }
      extra={
        <Space>
          <Button
            icon={<IconRefresh />}
            onClick={loadSubscriptions}
            loading={loading}
          />
          <Button
            icon={<IconFilter />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'tertiary'}
          />
        </Space>
      }
    >
      {showFilters && (
        <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
          <Space spacing='medium'>
            <Input
              placeholder={t('搜索用户名/邮箱')}
              value={usernameFilter}
              onChange={(value) => setUsernameFilter(value)}
              prefix={<IconSearch />}
              style={{ width: 200 }}
            />
            <Select
              placeholder={t('套餐')}
              value={planIdFilter}
              onChange={(value) => setPlanIdFilter(value)}
              style={{ width: 150 }}
              optionList={planOptions}
            />
            <Select
              placeholder={t('状态')}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: 120 }}
              optionList={statusOptions}
            />
            <Input
              placeholder={t('用户分组')}
              value={groupFilter}
              onChange={(value) => setGroupFilter(value)}
              style={{ width: 120 }}
            />
            <Button type='primary' onClick={handleSearch}>
              {t('搜索')}
            </Button>
            <Button onClick={handleResetFilters}>{t('重置')}</Button>
          </Space>
        </div>
      )}

      <CardTable
        columns={columns}
        dataSource={subscriptions}
        loading={loading}
        scroll={compactMode ? undefined : { x: 'max-content' }}
        pagination={{
          currentPage: page,
          pageSize: pageSize,
          total: total,
          pageSizeOpts: [10, 20, 50, 100],
          showSizeChanger: true,
          onPageChange: (p) => setPage(p),
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      />
    </Card>
  );
};

export default SubscriptionOverviewPage;
