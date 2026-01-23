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
import { Input, Modal, Select, Space, Switch, Tag } from '@douyinfe/semi-ui';

const GrantSubscriptionModal = ({
  t,
  grantModalOpen,
  handleGrant,
  granting,
  resetGrantState,
  userSearchText,
  setUserSearchText,
  users,
  selectedUser,
  setSelectedUser,
  plans,
  selectedPlan,
  setSelectedPlan,
  allowStack,
  setAllowStack,
}) => (
  <Modal
    title={t('授予订阅')}
    visible={grantModalOpen}
    onCancel={resetGrantState}
    onOk={handleGrant}
    confirmLoading={granting}
    width={600}
    bodyStyle={{ padding: 16 }}
  >
    <Space vertical style={{ width: '100%' }} spacing='tight'>
      <div>
        <div style={{ marginBottom: 8 }}>{t('选择用户')}</div>
        <Input
          placeholder={t('输入用户邮箱或用户名搜索')}
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
            {t('已选择')}: {selectedUser.email || selectedUser.username}
          </Tag>
        )}
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>{t('选择套餐')}</div>
        <Select
          style={{ width: '100%' }}
          placeholder={t('请选择套餐')}
          optionList={plans.map((plan) => ({
            label: plan.name || plan.type,
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
);

export default GrantSubscriptionModal;
