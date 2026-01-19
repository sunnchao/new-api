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
import { Banner, Tabs } from '@douyinfe/semi-ui';
import { useAdminPackagesData } from '../../../hooks/admin-packages/useAdminPackagesData';
import SubscriptionsTab from './SubscriptionsTab';
import PlansTab from './PlansTab';
import GrantSubscriptionModal from './GrantSubscriptionModal';
import PlanDrawer from './PlanDrawer';

const { TabPane } = Tabs;

const AdminPackagesPage = () => {
  const data = useAdminPackagesData();
  const {
    t,
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
    isMobile,
    setUserSearchText,
    setSelectedUser,
    setSelectedPlan,
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
    statusMap,
    formatDate,
    formatQuotaLimit,
    plansCompactMode,
    setPlansCompactMode,
    subscriptionsCompactMode,
    setSubscriptionsCompactMode,
  } = data;

  return (
    <div className='flex flex-col gap-4'>
      <Tabs
        type='card'
        collapsible
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
      >
        <TabPane itemKey='subscriptions' tab={t('订阅列表')}>
          <SubscriptionsTab
            t={t}
            subscriptions={subscriptions}
            loading={loading}
            activePage={activePage}
            pageSize={pageSize}
            total={total}
            setActivePage={setActivePage}
            setPageSize={setPageSize}
            loadSubscriptions={loadSubscriptions}
            handleOpenGrantModal={handleOpenGrantModal}
            resetLimitSavingId={resetLimitSavingId}
            handleUpdateResetLimit={handleUpdateResetLimit}
            statusMap={statusMap}
            formatDate={formatDate}
            handleCancelSubscription={handleCancelSubscription}
            handleDeleteSubscription={handleDeleteSubscription}
            compactMode={subscriptionsCompactMode}
            setCompactMode={setSubscriptionsCompactMode}
          />
        </TabPane>
        <TabPane itemKey='plans' tab={t('套餐管理')}>
          <PlansTab
            t={t}
            plans={plans}
            loading={loading}
            loadPlans={loadPlans}
            openPlanModal={openPlanModal}
            handleDeletePlan={handleDeletePlan}
            formatQuotaLimit={formatQuotaLimit}
            compactMode={plansCompactMode}
            setCompactMode={setPlansCompactMode}
          />
        </TabPane>
      </Tabs>

      {error && <Banner type='danger' description={error} />}

      <GrantSubscriptionModal
        t={t}
        grantModalOpen={grantModalOpen}
        handleGrant={handleGrant}
        granting={granting}
        resetGrantState={resetGrantState}
        userSearchText={userSearchText}
        setUserSearchText={setUserSearchText}
        users={users}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        plans={plans}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        allowStack={allowStack}
        setAllowStack={setAllowStack}
      />

      <PlanDrawer
        t={t}
        planModalOpen={planModalOpen}
        editingPlan={editingPlan}
        planSaving={planSaving}
        planFormApiRef={planFormApiRef}
        handleClosePlanDrawer={handleClosePlanDrawer}
        handleSavePlan={handleSavePlan}
        groupOptions={groupOptions}
        groupsLoading={groupsLoading}
        isMobile={isMobile}
      />
    </div>
  );
};

export default AdminPackagesPage;
