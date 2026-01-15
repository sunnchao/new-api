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

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Input,
  Select,
  Banner,
  Form,
  Switch,
} from '@douyinfe/semi-ui';
import { API } from '../../helpers';

const AdminPackages = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [userSearchText, setUserSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState('');

  const statusMap = {
    active: { label: 'packages.admin.subscriptions.status.active', color: 'green' },
    expired: { label: 'packages.admin.subscriptions.status.expired', color: 'grey' },
    cancelled: { label: 'packages.admin.subscriptions.status.cancelled', color: 'orange' },
    exhausted: { label: 'packages.admin.subscriptions.status.exhausted', color: 'red' },
    pending: { label: 'packages.admin.subscriptions.status.pending', color: 'blue' },
  };

  const formatQuota = (value) => {
    if (!Number.isFinite(value)) return '-';
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(2)}W`;
    }
    return `${value}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(
        `/api/packages-admin/subscriptions?p=${activePage}&page_size=${pageSize}`
      );

      if (res?.data?.success) {
        setSubscriptions(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
      } else {
        setError(res?.data?.message || t('packages.admin.subscriptions.loadFailed'));
      }
    } catch (err) {
      setError(err.message || t('packages.admin.subscriptions.loadFailed'));
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
      const res = await API.get(`/api/packages-admin/users/search?keyword=${keyword}`);
      if (res?.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser || !selectedPlan) {
      Modal.warning({
        title: t('packages.admin.grant.warning'),
        content: t('packages.admin.grant.selectUserAndPlan'),
      });
      return;
    }

    setGranting(true);
    try {
      const res = await API.post('/api/packages-admin/grant-subscription', {
        user_id: selectedUser.id,
        plan_type: selectedPlan.type,
        hash_id: selectedPlan.hash_id,
      });

      if (res?.data?.success) {
        Modal.success({
          title: t('packages.admin.grant.success'),
          content: res.data.message || t('packages.admin.grant.success'),
        });
        setGrantModalOpen(false);
        setSelectedUser(null);
        setSelectedPlan(null);
        setUserSearchText('');
        await loadSubscriptions();
      } else {
        Modal.error({
          title: t('packages.admin.grant.failed'),
          content: res?.data?.message || t('packages.admin.grant.failed'),
        });
      }
    } finally {
      setGranting(false);
    }
  };

  const handleDeleteSubscription = async (subscription) => {
    Modal.confirm({
      title: t('packages.admin.subscriptions.deleteConfirm'),
      content: t('packages.admin.subscriptions.deleteConfirmContent'),
      onOk: async () => {
        try {
          const res = await API.delete(`/api/packages-admin/subscriptions/${subscription.id}`);

          if (res?.data?.success) {
            Modal.success({
              title: t('packages.admin.subscriptions.deleteSuccess'),
              content: res.data.message || t('packages.admin.subscriptions.deleteSuccess'),
            });
            await loadSubscriptions();
          } else {
            Modal.error({
              title: t('packages.admin.subscriptions.deleteFailed'),
              content: res?.data?.message || t('packages.admin.subscriptions.deleteFailed'),
            });
          }
        } catch (err) {
          Modal.error({
            title: t('packages.admin.subscriptions.deleteFailed'),
            content: err.message || t('packages.admin.subscriptions.deleteFailed'),
          });
        }
      },
    });
  };

  const handleCancelSubscription = async (subscription) => {
    Modal.confirm({
      title: t('packages.admin.subscriptions.cancelConfirm'),
      content: t('packages.admin.subscriptions.cancelConfirmContent'),
      onOk: async () => {
        try {
          const res = await API.delete(`/api/packages-admin/subscriptions/${subscription.id}`);

          if (res?.data?.success) {
            Modal.success({
              title: t('packages.admin.subscriptions.cancelSuccess'),
              content: res.data.message || t('packages.admin.subscriptions.cancelSuccess'),
            });
            await loadSubscriptions();
          } else {
            Modal.error({
              title: t('packages.admin.subscriptions.cancelFailed'),
              content: res?.data?.message || t('packages.admin.subscriptions.cancelFailed'),
            });
          }
        } catch (err) {
          Modal.error({
            title: t('packages.admin.subscriptions.cancelFailed'),
            content: err.message || t('packages.admin.subscriptions.cancelFailed'),
          });
        }
      },
    });
  };

  const handlePlanManagement = () => {
    window.location.href = '/console/setting';
  };

  const openPlanModal = (plan = null) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (values) => {
    try {
      const res = editingPlan
        ? await API.put(`/api/packages-admin/plans/${editingPlan.id}`, values)
        : await API.post('/api/packages-admin/plans', values);

      if (res?.data?.success) {
        Modal.success({
          title: editingPlan ? t('packages.admin.plans.updateSuccess') : t('packages.admin.plans.createSuccess'),
          content: res.data.message,
        });
        setPlanModalOpen(false);
        setEditingPlan(null);
        await loadPlans();
      } else {
        Modal.error({
          title: editingPlan ? t('packages.admin.plans.updateFailed') : t('packages.admin.plans.createFailed'),
          content: res?.data?.message,
        });
      }
    } catch (err) {
      Modal.error({
        title: t('packages.admin.plans.saveFailed'),
        content: err.message,
      });
    }
  };

  const handleDeletePlan = async (plan) => {
    Modal.confirm({
      title: t('packages.admin.plans.deleteConfirm'),
      content: t('packages.admin.plans.deleteConfirmContent'),
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

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptions();
    } else if (activeTab === 'plans') {
      loadPlans();
    }
  }, [activeTab, loadSubscriptions]);

  useEffect(() => {
    if (userSearchText.length >= 2) {
      searchUsers(userSearchText);
    } else {
      setUsers([]);
    }
  }, [userSearchText]);

  const subscriptionColumns = [
    {
      title: t('packages.admin.subscriptions.user'),
      dataIndex: 'user',
      render: (user) => user?.email || user?.username || '-',
    },
    {
      title: t('packages.admin.subscriptions.plan'),
      dataIndex: 'package_plan',
      render: (plan) => plan?.type || '-',
    },
    {
      title: t('packages.admin.subscriptions.status.title'),
      dataIndex: 'status',
      render: (status) => {
        const statusInfo = statusMap[status] || statusMap.pending;
        return (
          <Tag color={statusInfo.color}>{t(statusInfo.label)}</Tag>
        );
      },
    },
    {
      title: t('packages.admin.subscriptions.quota'),
      render: (_, record) => `${formatQuota(record.remain_quota)} / ${formatQuota(record.total_quota)}`,
    },
    {
      title: t('packages.admin.subscriptions.startTime'),
      dataIndex: 'start_time',
      render: formatDate,
    },
    {
      title: t('packages.admin.subscriptions.endTime'),
      dataIndex: 'end_time',
      render: formatDate,
    },
    {
      title: t('packages.admin.subscriptions.actions'),
      render: (_, record) => (
        <Space>
          <Button
            size='small'
            type='danger'
            disabled={record.status === 'expired' || record.status === 'cancelled'}
            onClick={() => handleCancelSubscription(record)}
          >
            {t('packages.admin.subscriptions.cancel')}
          </Button>
          <Button
            size='small'
            type='danger'
            onClick={() => handleDeleteSubscription(record)}
          >
            {t('packages.admin.subscriptions.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  const planColumns = [
    {
      title: t('packages.admin.plans.name'),
      dataIndex: 'name',
      render: (name, record) => name || record.type,
    },
    {
      title: t('packages.admin.plans.type'),
      dataIndex: 'type',
    },
    {
      title: t('packages.admin.plans.price'),
      render: (_, record) => `${record.price} ${record.currency}`,
    },
    {
      title: t('packages.admin.plans.quota'),
      dataIndex: 'total_quota',
      render: formatQuota,
    },
    {
      title: t('packages.admin.plans.duration'),
      render: (_, record) =>
        `${record.duration_value} ${record.duration_unit}`,
    },
    {
      title: t('packages.admin.plans.service'),
      dataIndex: 'service_type',
    },
    {
      title: t('packages.admin.plans.actions'),
      render: (_, record) => (
        <Space>
          <Button size='small' onClick={() => openPlanModal(record)}>
            {t('packages.admin.plans.edit')}
          </Button>
          <Button size='small' type='danger' onClick={() => handleDeletePlan(record)}>
            {t('packages.admin.plans.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className='w-full max-w-7xl mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <h2>{t('packages.admin.title')}</h2>
          <Space>
            <Button onClick={() => setActiveTab('subscriptions')} theme={activeTab === 'subscriptions' ? 'solid' : 'light'}>
              {t('packages.admin.tab.subscriptions')}
            </Button>
            <Button onClick={() => setActiveTab('plans')} theme={activeTab === 'plans' ? 'solid' : 'light'}>
              {t('packages.admin.tab.plans')}
            </Button>
          </Space>
        </div>

        {error && <Banner type='danger' description={error} />}

        {activeTab === 'subscriptions' && (
          <Card
            title={t('packages.admin.subscriptions.title')}
            extra={
              <Space>
                <Button onClick={loadSubscriptions} loading={loading}>
                  {t('packages.action.refresh')}
                </Button>
                <Button theme='solid' onClick={() => setGrantModalOpen(true)}>
                  {t('packages.admin.grant.title')}
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
        )}

        {activeTab === 'plans' && (
          <Card
            title={t('packages.admin.plans.title')}
            headerExtraContent={
              <Space>
                <Button onClick={loadPlans} loading={loading}>
                  {t('packages.action.refresh')}
                </Button>
                <Button theme='solid' onClick={() => openPlanModal()}>
                  {t('packages.admin.plans.create')}
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
        )}

        <Modal
          title={t('packages.admin.grant.title')}
          visible={grantModalOpen}
          onCancel={() => {
            setGrantModalOpen(false);
            setSelectedUser(null);
            setSelectedPlan(null);
            setUserSearchText('');
          }}
          onOk={handleGrant}
          confirmLoading={granting}
          width={600}
        >
          <Space vertical style={{ width: '100%' }} spacing='loose'>
            <div>
              <div style={{ marginBottom: 8 }}>{t('packages.admin.grant.selectUser')}</div>
              <Input
                placeholder={t('packages.admin.grant.userSearchPlaceholder')}
                value={userSearchText}
                onChange={setUserSearchText}
                showClear
              />
              {users.length > 0 && (
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
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
                  {t('packages.admin.grant.selected')}: {selectedUser.email || selectedUser.username}
                </Tag>
              )}
            </div>

            <div>
              <div style={{ marginBottom: 8 }}>{t('packages.admin.grant.selectPlan')}</div>
              <Select
                style={{ width: '100%' }}
                placeholder={t('packages.admin.grant.planPlaceholder')}
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
          </Space>
        </Modal>

        <Modal
          title={editingPlan ? t('packages.admin.plans.editTitle') : t('packages.admin.plans.createTitle')}
          visible={planModalOpen}
          onCancel={() => {
            setPlanModalOpen(false);
            setEditingPlan(null);
          }}
          footer={null}
          width={800}
        >
          <Form
            initValues={editingPlan || {
              currency: 'CNY',
              duration_unit: 'month',
              is_active: true,
              show_in_portal: true,
            }}
            onSubmit={handleSavePlan}
            labelPosition='left'
            labelWidth={150}
          >
            <Form.Input
              field='name'
              label={t('packages.admin.plans.name')}
              rules={[{ required: true, message: t('packages.admin.plans.nameRequired') }]}
            />
            <Form.Input
              field='type'
              label={t('packages.admin.plans.type')}
              rules={[{ required: true, message: t('packages.admin.plans.typeRequired') }]}
              disabled={!!editingPlan}
            />
            <Form.TextArea
              field='description'
              label={t('packages.admin.plans.description')}
              rows={3}
            />
            <Form.InputNumber
              field='price'
              label={t('packages.admin.plans.price')}
              rules={[{ required: true, message: t('packages.admin.plans.priceRequired') }]}
              min={0}
              step={0.01}
            />
            <Form.Select
              field='currency'
              label={t('packages.admin.plans.currency')}
              optionList={[
                { label: 'CNY', value: 'CNY' },
                { label: 'USD', value: 'USD' },
              ]}
            />
            <Form.InputNumber
              field='total_quota'
              label={t('packages.admin.plans.quota')}
              rules={[{ required: true, message: t('packages.admin.plans.quotaRequired') }]}
              min={0}
            />
            <Form.InputNumber
              field='duration_value'
              label={t('packages.admin.plans.durationValue')}
              min={0}
            />
            <Form.Select
              field='duration_unit'
              label={t('packages.admin.plans.durationUnit')}
              optionList={[
                { label: t('packages.admin.plans.day'), value: 'day' },
                { label: t('packages.admin.plans.month'), value: 'month' },
                { label: t('packages.admin.plans.year'), value: 'year' },
              ]}
            />
            <Form.Input
              field='service_type'
              label={t('packages.admin.plans.service')}
              rules={[{ required: true, message: t('packages.admin.plans.serviceRequired') }]}
            />
            <Form.Switch
              field='is_active'
              label={t('packages.admin.plans.isActive')}
            />
            <Form.Switch
              field='show_in_portal'
              label={t('packages.admin.plans.showInPortal')}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onClick={() => setPlanModalOpen(false)}>
                {t('packages.admin.plans.cancel')}
              </Button>
              <Button theme='solid' htmlType='submit'>
                {t('packages.admin.plans.save')}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AdminPackages;
