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

import React, { useEffect } from 'react';
import { Button, Form, SideSheet, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { IconClose, IconSave } from '@douyinfe/semi-icons';
import { renderQuotaWithPrompt, getQuotaPerUnit } from '../../../helpers';
import Decimal from 'decimal.js';

const { Title, Text } = Typography;

const PlanDrawer = ({
  t,
  planModalOpen,
  editingPlan,
  planSaving,
  planFormApiRef,
  handleClosePlanDrawer,
  handleSavePlan,
  groupOptions,
  groupsLoading,
  isMobile,
}) => {
  const normalizeInitialValues = (plan) => {
    if (!plan) return null;

// 计算 total_quota 等字段的实际值
    if (plan.total_quota != 0) {
      plan.total_quota = Decimal(plan.total_quota).div(getQuotaPerUnit()).toNumber();
    }
    if (plan.daily_quota_per_plan != 0) {
      plan.daily_quota_per_plan = Decimal(plan.daily_quota_per_plan).div(getQuotaPerUnit()).toNumber();
    }
    if (plan.weekly_quota_per_plan != 0) {
      plan.weekly_quota_per_plan = Decimal(plan.weekly_quota_per_plan).div(getQuotaPerUnit()).toNumber();
    }
    if (plan.monthly_quota_per_plan != 0) {
      plan.monthly_quota_per_plan = Decimal(plan.monthly_quota_per_plan).div(getQuotaPerUnit()).toNumber();
    }

    return {
      ...plan,
      deduction_group: plan.deduction_group 
        ? plan.deduction_group.split(',').map(g => g.trim()).filter(Boolean)
        : [],
    };
  };

  const handleSubmit = (values) => {
    const normalizedValues = {
      ...values,
      deduction_group: Array.isArray(values.deduction_group)
        ? values.deduction_group.join(',')
        : (values.deduction_group || '').trim(),
    };
    // 计算 total_quota 等字段的实际值
    if (normalizedValues.total_quota != 0) {
      normalizedValues.total_quota = Decimal(normalizedValues.total_quota).mul(getQuotaPerUnit()).toNumber();
    }
    // 计算 daily_quota_per_plan 等字段的实际值
    if (normalizedValues.daily_quota_per_plan != 0) {
      normalizedValues.daily_quota_per_plan = Decimal(normalizedValues.daily_quota_per_plan).mul(getQuotaPerUnit()).toNumber();
    }
    if (normalizedValues.weekly_quota_per_plan != 0) {
      normalizedValues.weekly_quota_per_plan = Decimal(normalizedValues.weekly_quota_per_plan).mul(getQuotaPerUnit()).toNumber();
    }
    if (normalizedValues.monthly_quota_per_plan != 0) {
      normalizedValues.monthly_quota_per_plan = Decimal(normalizedValues.monthly_quota_per_plan).mul(getQuotaPerUnit()).toNumber();
    }
    // 保存
    handleSavePlan(normalizedValues);
  };

  useEffect(() => {
    if (planFormApiRef.current && editingPlan) {
      planFormApiRef.current.setValues(normalizeInitialValues(JSON.parse(JSON.stringify(editingPlan))));
    }
  }, [editingPlan]);

  return (
    <SideSheet
      title={
        <Space>
          <Tag color={editingPlan ? 'blue' : 'green'} shape='circle'>
            {editingPlan ? t('编辑') : t('创建')}
          </Tag>
          <Title heading={4} className='m-0'>
            {editingPlan ? t('编辑套餐') : t('创建套餐')}
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
          <Button className='!rounded-lg' onClick={handleClosePlanDrawer} icon={<IconClose />}>
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
          editingPlan
            ? normalizeInitialValues(JSON.parse(JSON.stringify(editingPlan)))
            : {
                currency: 'CNY',
                max_client_count: 3,
                sort_order: 0,
                is_unlimited_time: false,
                duration_unit: 'month',
                duration_value: 1,
                is_active: true,
                show_in_portal: true,
                deduction_group: [],
                daily_quota_per_plan: 0,
                weekly_quota_per_plan: 0,
                monthly_quota_per_plan: 0,
                reset_quota_limit: 0,
              }
        }
        onSubmit={handleSubmit}
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
                rules={[{ required: true, message: t('请输入套餐名称') }]}
              />
              <Form.Input
                field='type'
                label={t('类型')}
                placeholder={t('例如：claude_basic (唯一标识)')}
                rules={[{ required: true, message: t('请输入套餐类型') }]}
                disabled={!!editingPlan}
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
                rules={[{ required: true, message: t('请输入价格') }]}
                min={0}
                step={0.01}
              />

              <Form.InputNumber field='max_client_count' label={t('最大客户端数')} min={1} />
              <Form.InputNumber field='sort_order' label={t('排序')} min={0} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Form.InputNumber
                  field='total_quota'
                  label={t('额度')}
                  rules={[{ required: true, message: t('请输入额度') }]}
                  min={1}
                />
              </div>

              <Form.InputNumber field='daily_quota_per_plan' label={t('每日额度上限')} min={0} />
              <Form.InputNumber field='weekly_quota_per_plan' label={t('每周额度上限')} min={0} />
              <Form.InputNumber field='monthly_quota_per_plan' label={t('每月额度上限')} min={0} />
              <Form.InputNumber field='reset_quota_limit' label={t('可重置次数')} min={0} />
              <div style={{ gridColumn: '1 / -1', marginTop: -4 }}>
                <div style={{ fontSize: 12, color: 'var(--semi-color-text-2)' }}>
                  {t('填 0 表示不限')}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <Form.Select
                  field='deduction_group'
                  label={t('抵扣分组')}
                  placeholder={t('选择分组限制，留空表示允许所有分组')}
                  optionList={groupOptions}
                  loading={groupsLoading}
                  multiple
                  showClear
                  showSearch
                  filter
                  extraText={
                    <Text type='tertiary' size='small'>
                      {t('限制该套餐只能被指定分组的令牌使用。留空则所有分组均可使用。')}
                    </Text>
                  }
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
                  { label: t('月'), value: 'month' },
                  { label: t('季度'), value: 'quarter' },
                ]}
              />

              <Form.Switch field='is_active' label={t('启用')} />
              <Form.Switch field='show_in_portal' label={t('在门户显示')} />
            </div>
          </div>
        )}
      </Form>
    </SideSheet>
  );
};

export default PlanDrawer;
