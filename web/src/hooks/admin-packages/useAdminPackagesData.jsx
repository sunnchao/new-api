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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@douyinfe/semi-ui';
import { API, renderQuota, showError, showSuccess } from '../../helpers';
import { useIsMobile } from '../common/useIsMobile';
import { useTableCompactMode } from '../common/useTableCompactMode';

const getStatusMap = (t) => ({
  active: {
    label: t('生效中'),
    color: 'green',
  },
  expired: {
    label: t('已过期'),
    color: 'grey',
  },
  cancelled: {
    label: t('已取消'),
    color: 'orange',
  },
  exhausted: {
    label: t('已耗尽'),
    color: 'red',
  },
  pending: {
    label: t('待处理'),
    color: 'blue',
  },
});

const formatDate = (timestamp, language = 'zh') => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);

  // 根据语言返回不同的日期格式
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

const formatQuotaLimit = (value, t) =>
  value && value > 0 ? renderQuota(value) : t('不限');

export const useAdminPackagesData = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const currentLanguage = i18n.language || 'zh';
  const statusMap = getStatusMap(t);
  const [activeTab, setActiveTab] = useState('subscriptions');

  const [plansCompactMode, setPlansCompactMode] = useTableCompactMode('adminPackagesPlans');
  const [subscriptionsCompactMode, setSubscriptionsCompactMode] = useTableCompactMode('adminPackagesSubscriptions');
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
        setError(res?.data?.message || t('加载订阅失败'));
      }
    } catch (err) {
      setError(err.message || t('加载订阅失败'));
    } finally {
      setLoading(false);
    }
  }, [activePage, pageSize, t]);

  const loadPlans = useCallback(async () => {
    try {
      const res = await API.get('/api/packages-admin/plans');
      if (res?.data?.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  }, []);

  const searchUsers = useCallback(async (keyword) => {
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
  }, []);

  const resetGrantState = useCallback(() => {
    setGrantModalOpen(false);
    setSelectedUser(null);
    setSelectedPlan(null);
    setUserSearchText('');
    setAllowStack(false);
  }, []);

  const handleGrant = useCallback(async () => {
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
        resetGrantState();
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
  }, [allowStack, loadSubscriptions, resetGrantState, selectedPlan, selectedUser, t]);

  const handleDeleteSubscription = useCallback(
    async (subscription) => {
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
                content: res.data.message || t('删除成功'),
              });
              await loadSubscriptions();
            } else {
              Modal.error({
                title: t('删除失败'),
                content: res?.data?.message || t('删除失败'),
              });
            }
          } catch (err) {
            Modal.error({
              title: t('删除失败'),
              content: err.message || t('删除失败'),
            });
          }
        },
      });
    },
    [loadSubscriptions, t],
  );

  const handleCancelSubscription = useCallback(
    async (subscription) => {
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
                content: res.data.message || t('取消成功'),
              });
              await loadSubscriptions();
            } else {
              Modal.error({
                title: t('取消失败'),
                content: res?.data?.message || t('取消失败'),
              });
            }
          } catch (err) {
            Modal.error({
              title: t('取消失败'),
              content: err.message || t('取消失败'),
            });
          }
        },
      });
    },
    [loadSubscriptions, t],
  );

  const handleClosePlanDrawer = useCallback(() => {
    setPlanModalOpen(false);
    setEditingPlan(null);
    planFormApiRef.current?.reset();
  }, []);

  const openPlanModal = useCallback((plan = null) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  }, []);

  const handleSavePlan = useCallback(
    async (values) => {
      const payload = {
        ...values,
        type: (values.type || '').trim(),
        deduction_group: Array.isArray(values.deduction_group)
          ? values.deduction_group.join(',').trim()
          : (values.deduction_group || '').trim(),
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
          showSuccess(editingPlan ? t('更新成功') : t('创建成功'))
          setPlanModalOpen(false);
          setEditingPlan(null);
          await loadPlans();
        } else {
          showSuccess(editingPlan ? t('更新成功') : t('创建成功'))
        }
      } catch (err) {
        showError(err.message)
      } finally {
        setPlanSaving(false);
      }
    },
    [editingPlan, loadPlans, t],
  );

  const handleDeletePlan = useCallback(
    async (plan) => {
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
    },
    [loadPlans, t],
  );

  const handleUpdateResetLimit = useCallback(
    async (subscription, value) => {
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
            content: res?.data?.message || t('更新重置限制失败'),
          });
        }
      } finally {
        setResetLimitSavingId(null);
      }
    },
    [loadSubscriptions, t],
  );

  const handleOpenGrantModal = useCallback(() => {
    loadPlans();
    setAllowStack(false);
    setGrantModalOpen(true);
  }, [loadPlans]);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptions();
    } else if (activeTab === 'plans') {
      loadPlans();
    }
  }, [activeTab, loadSubscriptions, loadPlans]);

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
  }, [searchUsers, userSearchText]);

  return {
    t,
    isMobile,
    statusMap,
    formatDate: (timestamp) => formatDate(timestamp, currentLanguage),
    formatQuotaLimit: (value) => formatQuotaLimit(value, t),
    plansCompactMode,
    setPlansCompactMode,
    subscriptionsCompactMode,
    setSubscriptionsCompactMode,
    activeTab,
    setActiveTab,
    subscriptions,
    plans,
    users,
    loading,
    activePage,
    pageSize,
    total,
    userSearchText,
    selectedUser,
    selectedPlan,
    grantModalOpen,
    allowStack,
    planModalOpen,
    editingPlan,
    granting,
    planSaving,
    resetLimitSavingId,
    error,
    groupOptions,
    groupsLoading,
    planFormApiRef,
    setUserSearchText,
    setSelectedUser,
    setSelectedPlan,
    setGrantModalOpen,
    setAllowStack,
    setActivePage,
    setPageSize,
    loadSubscriptions,
    loadPlans,
    handleGrant,
    handleDeleteSubscription,
    handleCancelSubscription,
    handleClosePlanDrawer,
    openPlanModal,
    handleSavePlan,
    handleDeletePlan,
    handleUpdateResetLimit,
    handleOpenGrantModal,
    resetGrantState,
  };
};
