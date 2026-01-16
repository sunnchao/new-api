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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Input,
  InputNumber,
  Select,
  Banner,
  Form,
  Switch,
  Tabs,
  SideSheet,
  Typography,
} from '@douyinfe/semi-ui';
import { IconSave, IconClose } from '@douyinfe/semi-icons';
import {API, renderQuota, renderQuotaWithAmount, renderQuotaWithPrompt} from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { TabPane } = Tabs;
const { Title } = Typography;

const AdminPackages = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearchText, setUserSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [allowStack, setAllowStack] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [granting, setGranting] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [resetLimitSavingId, setResetLimitSavingId] = useState(null);
  const [error, setError] = useState('');
  const planFormApiRef = useRef(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await API.get('/api/user/self/groups');
      const { success, data, message } = res?.data || {};
      if (!success) {
        throw new Error(message || t('加载分组失败'));
      }

      const options = Object.entries(data || {}).map(([group, info]) => ({
        label: info?.desc || group,
        value: group,
        ratio: info?.ratio,
      }));
      options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
      setGroupOptions(options);
    } catch (e) {
      setGroupOptions([]);
      Modal.error({
        title: t('加载分组失败'),
        content: e?.message || t('加载分组失败'),
      });
    } finally {
      setGroupsLoading(false);
    }
  }, [t]);

  const statusMap = {
    active: {
      label: '生效中',
      color: 'green',
    },
    expired: {
      label: '已过期',
      color: 'grey',
    },
    cancelled: {
      label: '已取消',
      color: 'orange',
    },
    exhausted: {
      label: '已耗尽',
      color: 'red',
    },
    pending: {
      label: '待处理',
      color: 'blue',
    },
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatQuotaLimit = (value) =>
      value && value > 0
          ? renderQuota(value)
          : t('不限');

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(
          `/api/packages-admin/subscriptions?page=${activePage}&page_size=${pageSize}`,
      );

      if (res?.data?.success) {
        const data = res.data.data || {};
        setSubscriptions(data.subscriptions || data.items || []);
        setTotal(data.total || 0);
      } else {
        setError(
            res?.data?.message || t('加载订阅失败'),
        );
      }
    } catch (err) {
      setError(err.message || t('加载订阅失败'));
    } finally {
      setLoading(false);
    }
  }, [activePage, pageSize, t]);

  const loadPlans = async () => {
    try {
      const res = await API.get('/api/packages-admin/plans');
      if (res?.data?.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const searchUsers = async (keyword) => {
    if (!keyword || keyword.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const res = await API.get(
          `/api/packages-admin/users/search?keyword=${keyword}`,
      );
      if (res?.data?.success) {
        const data = res.data.data;
        const list = Array.isArray(data) ? data : data?.users || [];
        setUsers(list);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser || !selectedPlan) {
      Modal.warning({
        title: t('警告'),
        content: t('请选择用户和套餐'),
      });
      return;
    }

    setGranting(true);
    try {
      const res = await API.post('/api/packages-admin/grant-subscription', {
        user_id: selectedUser.id,
        plan_type: selectedPlan.type,
        allow_stack: allowStack,
      });

      if (res?.data?.success) {
        Modal.success({
          title: t('授予成功'),
          content: res.data.message || t('授予成功'),
        });
        setGrantModalOpen(false);
        setSelectedUser(null);
        setSelectedPlan(null);
        setUserSearchText('');
        setAllowStack(false);
        await loadSubscriptions();
      } else {
        Modal.error({
          title: t('授予失败'),
          content: res?.data?.message || t('授予失败'),
        });
      }
    } finally {
      setGranting(false);
    }
  };

  const handleDeleteSubscription = async (subscription) => {
    Modal.confirm({
      title: t('确认删除订阅'),
      content: t('确定要删除这个订阅吗？'),
      onOk: async () => {
        try {
          const res = await API.delete(
              `/api/packages-admin/subscriptions/${subscription.id}`,
          );

          if (res?.data?.success) {
            Modal.success({
              title: t('删除成功'),
              content:
                  res.data.message ||
                  t('删除成功'),
            });
            await loadSubscriptions();
          } else {
            Modal.error({
              title: t('删除失败'),
              content:
                  res?.data?.message ||
                  t('删除失败'),
            });
          }
        } catch (err) {
          Modal.error({
            title: t('删除失败'),
            content:
                err.message || t('删除失败'),
          });
        }
      },
    });
  };

  const handleCancelSubscription = async (subscription) => {
    Modal.confirm({
      title: t('确认取消订阅'),
      content: t('确定要取消这个订阅吗？'),
      onOk: async () => {
        try {
          const res = await API.delete(
              `/api/packages-admin/subscriptions/${subscription.id}`,
          );

          if (res?.data?.success) {
            Modal.success({
              title: t('取消成功'),
              content:
                  res.data.message ||
                  t('取消成功'),
            });
            await loadSubscriptions();
          } else {
            Modal.error({
              title: t('取消失败'),
              content:
                  res?.data?.message ||
                  t('取消失败'),
            });
          }
        } catch (err) {
          Modal.error({
            title: t('取消失败'),
            content:
                err.message || t('取消失败'),
          });
        }
      },
    });
  };

  const handleClosePlanDrawer = () => {
    setPlanModalOpen(false);
    setEditingPlan(null);
    planFormApiRef.current?.reset();
  };

  const openPlanModal = (plan = null) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (values) => {
    const payload = {
      ...values,
      type: (values.type || '').trim(),
      service_type: (values.service_type || '').trim(),
      deduction_group: (values.deduction_group || '').trim(),
    };

    if (payload.is_unlimited_time) {
      payload.duration_value = 0;
    }

    setPlanSaving(true);
    try {
      const res = editingPlan
          ? await API.put(`/api/packages-admin/plans/${editingPlan.id}`, payload)
          : await API.post('/api/packages-admin/plans', payload);

      if (res?.data?.success) {
        Modal.success({
          title: editingPlan
              ? t('更新成功')
              : t('创建成功'),
          content: res.data.message,
        });
        setPlanModalOpen(false);
        setEditingPlan(null);
        await loadPlans();
      } else {
        Modal.error({
          title: editingPlan
              ? t('更新失败')
              : t('创建失败'),
          content: res?.data?.message,
        });
      }
    } catch (err) {
      Modal.error({
        title: t('保存失败'),
        content: err.message,
      });
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    Modal.confirm({
      title: t('确认删除套餐'),
      content: t('确定要删除这个套餐吗？'),
      onOk: async () => {
        try {
          const res = await API.delete(`/api/packages-admin/plans/${plan.id}`);
          if (res?.data?.success) {
            Modal.success({
              title: t('packages.admin.plans.deleteSuccess'),
              content: res.data.message,
            });
            await loadPlans();
          } else {
            Modal.error({
              title: t('packages.admin.plans.deleteFailed'),
              content: res?.data?.message,
            });
          }
        } catch (err) {
          Modal.error({
            title: t('packages.admin.plans.deleteFailed'),
            content: err.message,
          });
        }
      },
    });
  };

  const handleUpdateResetLimit = async (subscription, value) => {
    const resetLimit = Math.max(Number(value || 0), 0);
    setResetLimitSavingId(subscription.id);
    try {
      const res = await API.put(
          `/api/packages-admin/subscriptions/${subscription.id}/reset-limit`,
          {
            reset_quota_limit: resetLimit,
          },
      );
      if (res?.data?.success) {
        await loadSubscriptions();
      } else {
        Modal.error({
          title: t('更新重置限制失败'),
          content:
              res?.data?.message ||
              t('更新重置限制失败'),
        });
      }
    } finally {
      setResetLimitSavingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptions();
    } else if (activeTab === 'plans') {
      loadPlans();
    }
  }, [activeTab, loadSubscriptions]);

  useEffect(() => {
    if (!planModalOpen) return;
    loadGroups();
  }, [planModalOpen, loadGroups]);

  useEffect(() => {
    if (userSearchText.length >= 2) {
      searchUsers(userSearchText);
    } else {
      setUsers([]);
    }
  }, [userSearchText]);

  const subscriptionColumns = [
    {
      title: t('用户'),
      render: (_, record) =>
          record?.user?.email || record?.user?.username || record?.user_id || '-',
    },
    {
      title: t('可重置次数'),
      render: (_, record) => (
          <InputNumber
              min={0}
              size='small'
              value={record.reset_quota_limit ?? 1}
              disabled={resetLimitSavingId === record.id}
              onChange={(value) => handleUpdateResetLimit(record, value)}
              style={{ width: 120 }}
              placeholder={t('可重置次数')}
          />
      ),
    },
    {
      title: t('套餐'),
      render: (_, record) =>
          record?.package_plan?.type || record?.plan_type || '-',
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      render: (status) => {
        const statusInfo = statusMap[status] || statusMap.pending;
        return <Tag color={statusInfo.color}>{t(statusInfo.label)}</Tag>;
      },
    },
    {
      title: t('额度'),
      render: (_, record) =>
          `${renderQuota(record.remain_quota)} / ${renderQuota(record.total_quota)}`,
    },
    {
      title: t('开始时间'),
      dataIndex: 'start_time',
      render: formatDate,
    },
    {
      title: t('结束时间'),
      dataIndex: 'end_time',
      render: formatDate,
    },
    {
      title: t('操作'),
      render: (_, record) => (
          <Space>
            <Button
                type='danger'
                disabled={
                    record.status === 'expired' || record.status === 'cancelled'
                }
                onClick={() => handleCancelSubscription(record)}
            >
              {t('取消')}
            </Button>
            <Button
                type='danger'
                onClick={() => handleDeleteSubscription(record)}
            >
              {t('删除')}
            </Button>
          </Space>
      ),
    },
  ];

  const planColumns = [
    {
      title: t('名称'),
      dataIndex: 'name',
      render: (name, record) => name || record.type,
    },
    {
      title: t('类型'),
      dataIndex: 'type',
    },
    {
      title: t('价格'),
      render: (_, record) => `${record.price} ${record.currency}`,
    },
    {
      title: t('额度'),
      dataIndex: 'total_quota',
      render: (_, record) => `${renderQuota(record.total_quota)}`,
    },
    {
      title: t('每日额度上限'),
      dataIndex: 'daily_quota_per_plan',
      render: (value) => formatQuotaLimit(value),
    },
    {
      title: t('每周额度上限'),
      dataIndex: 'weekly_quota_per_plan',
      render: (value) => formatQuotaLimit(value),
    },
    {
      title: t('每月额度上限'),
      dataIndex: 'monthly_quota_per_plan',
      render: (value) => formatQuotaLimit(value),
    },
    {
      title: t('可重置次数'),
      dataIndex: 'reset_quota_limit',
      render: (value) => (value ?? 1),
    },
    {
      title: t('时长'),
      render: (_, record) => {
        if (record.is_unlimited_time) {
          return t('不限时长');
        }
        const unitLabelMap = {
          day: t('天'),
          week: t('周'),
          month: t('月'),
          quarter: t('季度'),
        };
        const unitLabel =
            unitLabelMap[record.duration_unit] || record.duration_unit || '-';
        return `${record.duration_value || 0} ${unitLabel}`;
      },
    },
    {
      title: t('服务类型'),
      dataIndex: 'service_type',
    },
    {
      title: t('操作'),
      render: (_, record) => (
          <Space>
            <Button onClick={() => openPlanModal(record)}>
              {t('编辑')}
            </Button>
            <Button type='danger' onClick={() => handleDeletePlan(record)}>
              {t('删除')}
            </Button>
          </Space>
      ),
    },
  ];

  return (
      <div className='mt-[60px] px-2'>
        <div className='flex flex-col gap-4'>
          <Tabs
              type='card'
              collapsible
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
          >
            <TabPane
                itemKey='subscriptions'
                tab={t('订阅列表')}
            >
              <Card
                  title={t('订阅管理')}
                  extra={
                    <Space>
                      <Button onClick={loadSubscriptions} loading={loading}>
                        {t('刷新')}
                      </Button>
                      <Button
                          theme='solid'
                          onClick={() => {
                            loadPlans();
                            setAllowStack(false);
                            setGrantModalOpen(true);
                          }}
                      >
                        {t('授予订阅')}
                      </Button>
                    </Space>
                  }
              >
                <Table
                    columns={subscriptionColumns}
                    dataSource={subscriptions}
                    loading={loading}
                    pagination={{
                      currentPage: activePage,
                      pageSize: pageSize,
                      total: total,
                      pageSizeOpts: [10, 20, 50],
                      showSizeChanger: true,
                      onPageChange: (page) => setActivePage(page),
                      onPageSizeChange: (size) => {
                        setPageSize(size);
                        setActivePage(1);
                      },
                    }}
                />
              </Card>
            </TabPane>
            <TabPane itemKey='plans' tab={t('套餐管理')}>
              <Card
                  title={t('套餐管理')}
                  headerExtraContent={
                    <Space>
                      <Button onClick={loadPlans} loading={loading}>
                        {t('刷新')}
                      </Button>
                      <Button theme='solid' onClick={() => openPlanModal()}>
                        {t('创建')}
                      </Button>
                    </Space>
                  }
              >
                <Table
                    columns={planColumns}
                    dataSource={plans}
                    loading={loading}
                    pagination={false}
                />
              </Card>
            </TabPane>
          </Tabs>

          {error && <Banner type='danger' description={error} />}

          <Modal
              title={t('授予订阅')}
              visible={grantModalOpen}
              onCancel={() => {
                setGrantModalOpen(false);
                setSelectedUser(null);
                setSelectedPlan(null);
                setUserSearchText('');
                setAllowStack(false);
              }}
              onOk={handleGrant}
              confirmLoading={granting}
              width={600}
              bodyStyle={{ padding: 16 }}
          >
            <Space vertical style={{ width: '100%' }} spacing='tight'>
              <div>
                <div style={{ marginBottom: 8 }}>
                  {t('选择用户')}
                </div>
                <Input
                    placeholder={t('输入用户邮箱或用户名搜索')}
                    value={userSearchText}
                    onChange={setUserSearchText}
                    showClear
                />
                {users.length > 0 && (
                    <div
                        style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}
                    >
                      {users.map((user) => (
                          <div
                              key={user.id}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid var(--semi-color-border)',
                                borderRadius: 4,
                                marginBottom: 4,
                                cursor: 'pointer',
                                backgroundColor:
                                    selectedUser?.id === user.id
                                        ? 'var(--semi-color-fill-0)'
                                        : 'transparent',
                              }}
                              onClick={() => setSelectedUser(user)}
                          >
                            {user.email || user.username}
                          </div>
                      ))}
                    </div>
                )}
                {selectedUser && (
                    <Tag color='blue' style={{ marginTop: 8 }}>
                      {t('已选择')}:{' '}
                      {selectedUser.email || selectedUser.username}
                    </Tag>
                )}
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>
                  {t('选择套餐')}
                </div>
                <Select
                    style={{ width: '100%' }}
                    placeholder={t('请选择套餐')}
                    optionList={plans.map((plan) => ({
                      label: `${plan.name || plan.type} (${plan.service_type})`,
                      value: plan.type,
                    }))}
                    value={selectedPlan?.type}
                    onChange={(value) => {
                      const plan = plans.find((item) => item.type === value);
                      setSelectedPlan(plan || null);
                    }}
                    showClear
                />
              </div>

              <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
              >
                <div>{t('允许叠加')}</div>
                <Switch checked={allowStack} onChange={setAllowStack} />
              </div>
            </Space>
          </Modal>

          <SideSheet
              title={
                <Space>
                  <Tag color={editingPlan ? 'blue' : 'green'} shape='circle'>
                    {editingPlan ? t('编辑') : t('创建')}
                  </Tag>
                  <Title heading={4} className='m-0'>
                    {editingPlan
                        ? t('编辑套餐')
                        : t('创建套餐')}
                  </Title>
                </Space>
              }
              visible={planModalOpen}
              placement='right'
              width={isMobile ? '100%' : 720}
              bodyStyle={{ padding: 0 }}
              closeIcon={null}
              onCancel={handleClosePlanDrawer}
              footer={
                <div className='flex justify-end gap-2 bg-white p-2'>
                  <Button
                      className='!rounded-lg'
                      onClick={handleClosePlanDrawer}
                      icon={<IconClose />}
                  >
                    {t('取消')}
                  </Button>
                  <Button
                      theme='solid'
                      className='!rounded-lg'
                      htmlType='submit'
                      loading={planSaving}
                      onClick={() => planFormApiRef.current?.submitForm()}
                      icon={<IconSave />}
                  >
                    {t('保存')}
                  </Button>
                </div>
              }
          >
            <Form
                key={editingPlan?.id || 'new'}
                initValues={
                    editingPlan || {
                      currency: 'CNY',
                      max_client_count: 3,
                      sort_order: 0,
                      is_unlimited_time: false,
                      duration_unit: 'month',
                      duration_value: 1,
                      is_active: true,
                      show_in_portal: true,
                      deduction_group: '',
                      daily_quota_per_plan: 0,
                      weekly_quota_per_plan: 0,
                      monthly_quota_per_plan: 0,
                      reset_quota_limit: 1,
                    }
                }
                onSubmit={handleSavePlan}
                getFormApi={(api) => (planFormApiRef.current = api)}
                labelPosition='left'
                labelWidth={120}
            >
              {({ values, formApi }) => (
                  <div className='p-4'>
                    <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                        }}
                    >
                      <Form.Input
                          field='name'
                          label={t('名称')}
                          placeholder={t('例如：Claude Code 基础版')}
                          rules={[
                            {
                              required: true,
                              message: t('请输入套餐名称'),
                            },
                          ]}
                      />
                      <Form.Input
                          field='type'
                          label={t('类型')}
                          placeholder={t('例如：claude_basic (唯一标识)')}
                          rules={[
                            {
                              required: true,
                              message: t('请输入套餐类型'),
                            },
                          ]}
                          disabled={!!editingPlan}
                      />

                      <Form.Select
                          field='service_type'
                          label={t('服务类型')}
                          placeholder={t('选择服务类型')}
                          rules={[
                            {
                              required: true,
                              message: t('请选择服务类型'),
                            },
                          ]}
                          optionList={[
                            { label: 'claude_code', value: 'claude_code' },
                            { label: 'codex_code', value: 'codex_code' },
                            { label: 'gemini_code', value: 'gemini_code' },
                          ]}
                      />
                      <Form.Select
                          field='currency'
                          label={t('货币')}
                          optionList={[
                            { label: 'CNY', value: 'CNY' },
                            { label: 'USD', value: 'USD' },
                          ]}
                      />

                      <div style={{ gridColumn: '1 / -1' }}>
                        <Form.TextArea
                            field='description'
                            label={t('描述')}
                            placeholder={t('面向用户的描述（可选）')}
                            rows={2}
                        />
                      </div>

                      <Form.InputNumber
                          field='price'
                          label={t('价格')}
                          rules={[
                            {
                              required: true,
                              message: t('请输入价格'),
                            },
                          ]}
                          min={0}
                          step={0.01}
                      />

                      <Form.InputNumber
                          field='max_client_count'
                          label={t('最大客户端数')}
                          min={1}
                      />
                      <Form.InputNumber
                          field='sort_order'
                          label={t('排序')}
                          min={0}
                      />
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Form.InputNumber
                            field='total_quota'
                            label={t('额度')}
                            rules={[
                              {
                                required: true,
                                message: t('请输入额度'),
                              },
                            ]}
                            min={1}
                        />
                        {
                          renderQuotaWithPrompt(values.total_quota || 0, 6)
                        }
                      </div>

                      <Form.InputNumber
                          field='daily_quota_per_plan'
                          label={t('每日额度上限')}
                          min={0}
                      />
                      <Form.InputNumber
                          field='weekly_quota_per_plan'
                          label={t('每周额度上限')}
                          min={0}
                      />
                      <Form.InputNumber
                          field='monthly_quota_per_plan'
                          label={t('每月额度上限')}
                          min={0}
                      />
                      <Form.InputNumber
                          field='reset_quota_limit'
                          label={t('可重置次数')}
                          min={0}
                      />
                      <div style={{ gridColumn: '1 / -1', marginTop: -4 }}>
                        <div style={{ fontSize: 12, color: 'var(--semi-color-text-2)' }}>
                          {t('填 0 表示不限')}
                        </div>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <Form.Select
                            field='deduction_group'
                            label={t('抵扣分组')}
                            placeholder={t('留空表示允许所有分组（可选）')}
                            optionList={groupOptions}
                            loading={groupsLoading}
                            showClear
                            showSearch
                        />
                      </div>

                      <Form.Switch
                          field='is_unlimited_time'
                          label={t('不限时长')}
                          onChange={(checked) => {
                            if (checked) {
                              formApi?.setValue('duration_value', 0);
                            } else {
                              const cur = Number(values?.duration_value || 0);
                              if (cur <= 0) {
                                formApi?.setValue('duration_value', 1);
                              }
                            }
                          }}
                      />
                      <div />

                      <Form.InputNumber
                          field='duration_value'
                          label={t('时长数值')}
                          min={0}
                          disabled={!!values?.is_unlimited_time}
                      />
                      <Form.Select
                          field='duration_unit'
                          label={t('时长单位')}
                          disabled={!!values?.is_unlimited_time}
                          optionList={[
                            { label: t('天'), value: 'day' },
                            { label: t('周'), value: 'week' },
                            {
                              label: t('月'),
                              value: 'month',
                            },
                            {
                              label: t('季度'),
                              value: 'quarter',
                            },
                          ]}
                      />

                      <Form.Switch
                          field='is_active'
                          label={t('启用')}
                      />
                      <Form.Switch
                          field='show_in_portal'
                          label={t('在门户显示')}
                      />
                    </div>
                  </div>
              )}
            </Form>
          </SideSheet>
        </div>
      </div>
  );
};

export default AdminPackages;
