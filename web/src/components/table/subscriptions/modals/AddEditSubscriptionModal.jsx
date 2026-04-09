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

import React, { useEffect, useState, useRef } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  SideSheet,
  Space,
  Spin,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconCalendarClock,
  IconClose,
  IconCreditCard,
  IconSave,
} from '@douyinfe/semi-icons';
import { Clock, RefreshCw } from 'lucide-react';
import { API, showError, showSuccess } from '../../../../helpers';
import {
  quotaToDisplayAmount,
  displayAmountToQuota,
} from '../../../../helpers/quota';
import {
  convertSubscriptionAmountToFormValue,
  convertSubscriptionAmountToStorageValue,
  normalizeSubscriptionResetMode,
} from '../../../../helpers/subscriptionFormat';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import SubscriptionResetModeField from './SubscriptionResetModeField';

const { Text, Title } = Typography;

const durationUnitOptions = [
  { value: 'year', label: '年' },
  { value: 'month', label: '月' },
  { value: 'day', label: '日' },
  { value: 'hour', label: '小时' },
  { value: 'custom', label: '自定义(秒)' },
];

const resetPeriodOptions = [
  { value: 'never', label: '不重置' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'custom', label: '自定义(秒)' },
];

const normalizeGroupList = (value) => {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return [...new Set(source.map((item) => `${item}`.trim()).filter(Boolean))];
};

const AddEditSubscriptionModal = ({
  visible,
  handleClose,
  editingPlan,
  placement = 'left',
  refresh,
  t,
}) => {
  const [loading, setLoading] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const isEdit = editingPlan?.plan?.id !== undefined;
  const formKey = isEdit ? `edit-${editingPlan?.plan?.id}` : 'create';

  const getInitValues = () => ({
    title: '',
    subtitle: '',
    price_amount: 0,
    billing_mode: 'quota',
    currency: 'USD',
    duration_unit: 'month',
    duration_value: 1,
    custom_seconds: 0,
    quota_reset_period: 'never',
    quota_reset_mode: 'anchor',
    quota_reset_custom_seconds: 0,
    enabled: true,
    sort_order: 0,
    max_purchase_per_user: 0,
    total_amount: 0,
    upgrade_group: '',
    allowed_groups: [],
    stripe_price_id: '',
    creem_product_id: '',
    // Rate limits
    hourly_limit_amount: 0,
    hourly_limit_hours: 1,
    hourly_reset_mode: 'anchor',
    daily_limit_amount: 0,
    daily_reset_mode: 'anchor',
    weekly_limit_amount: 0,
    weekly_reset_mode: 'anchor',
    monthly_limit_amount: 0,
    monthly_reset_mode: 'anchor',
  });

  const buildFormValues = () => {
    const base = getInitValues();
    if (editingPlan?.plan?.id === undefined) return base;
    const p = editingPlan.plan || {};
    return {
      ...base,
      title: p.title || '',
      subtitle: p.subtitle || '',
      price_amount: Number(p.price_amount || 0),
      billing_mode: p.billing_mode || 'quota',
      currency: 'USD',
      duration_unit: p.duration_unit || 'month',
      duration_value: Number(p.duration_value || 1),
      custom_seconds: Number(p.custom_seconds || 0),
      quota_reset_period: p.quota_reset_period || 'never',
      quota_reset_mode: normalizeSubscriptionResetMode(p.quota_reset_mode),
      quota_reset_custom_seconds: Number(p.quota_reset_custom_seconds || 0),
      enabled: p.enabled !== false,
      sort_order: Number(p.sort_order || 0),
      max_purchase_per_user: Number(p.max_purchase_per_user || 0),
      total_amount: convertSubscriptionAmountToFormValue(
        p.total_amount || 0,
        p.billing_mode || 'quota',
        quotaToDisplayAmount,
      ),
      upgrade_group: p.upgrade_group || '',
      allowed_groups: normalizeGroupList(p.allowed_groups),
      stripe_price_id: p.stripe_price_id || '',
      creem_product_id: p.creem_product_id || '',
      // Rate limits
      hourly_limit_amount: convertSubscriptionAmountToFormValue(
        p.hourly_limit_amount || 0,
        p.billing_mode || 'quota',
        quotaToDisplayAmount,
        { legacyRequestQuotaCompat: true },
      ),
      hourly_limit_hours: Number(p.hourly_limit_hours || 1),
      hourly_reset_mode: normalizeSubscriptionResetMode(p.hourly_reset_mode),
      daily_limit_amount: convertSubscriptionAmountToFormValue(
        p.daily_limit_amount || 0,
        p.billing_mode || 'quota',
        quotaToDisplayAmount,
        { legacyRequestQuotaCompat: true },
      ),
      daily_reset_mode: normalizeSubscriptionResetMode(p.daily_reset_mode),
      weekly_limit_amount: convertSubscriptionAmountToFormValue(
        p.weekly_limit_amount || 0,
        p.billing_mode || 'quota',
        quotaToDisplayAmount,
        { legacyRequestQuotaCompat: true },
      ),
      weekly_reset_mode: normalizeSubscriptionResetMode(p.weekly_reset_mode),
      monthly_limit_amount: convertSubscriptionAmountToFormValue(
        p.monthly_limit_amount || 0,
        p.billing_mode || 'quota',
        quotaToDisplayAmount,
        { legacyRequestQuotaCompat: true },
      ),
      monthly_reset_mode: normalizeSubscriptionResetMode(p.monthly_reset_mode),
    };
  };

  useEffect(() => {
    if (!visible) return;
    setGroupLoading(true);
    API.get('/api/group')
      .then((res) => {
        if (res.data?.success) {
          setGroupOptions(res.data?.data || []);
        } else {
          setGroupOptions([]);
        }
      })
      .catch(() => setGroupOptions([]))
      .finally(() => setGroupLoading(false));
  }, [visible]);

  const submit = async (values) => {
    if (!values.title || values.title.trim() === '') {
      showError(t('套餐标题不能为空'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        plan: {
          ...values,
          price_amount: Number(values.price_amount || 0),
          billing_mode: values.billing_mode || 'quota',
          currency: 'USD',
          duration_value: Number(values.duration_value || 0),
          custom_seconds: Number(values.custom_seconds || 0),
          quota_reset_period: values.quota_reset_period || 'never',
          quota_reset_mode: normalizeSubscriptionResetMode(
            values.quota_reset_mode,
          ),
          quota_reset_custom_seconds:
            values.quota_reset_period === 'custom'
              ? Number(values.quota_reset_custom_seconds || 0)
              : 0,
          sort_order: Number(values.sort_order || 0),
          max_purchase_per_user: Number(values.max_purchase_per_user || 0),
          total_amount: convertSubscriptionAmountToStorageValue(
            values.total_amount,
            values.billing_mode || 'quota',
            displayAmountToQuota,
          ),
          upgrade_group: values.upgrade_group || '',
          allowed_groups: normalizeGroupList(values.allowed_groups).join(','),
          // Rate limits
          hourly_limit_amount: convertSubscriptionAmountToStorageValue(
            values.hourly_limit_amount,
            values.billing_mode || 'quota',
            displayAmountToQuota,
          ),
          hourly_limit_hours: Number(values.hourly_limit_hours || 1),
          hourly_reset_mode: normalizeSubscriptionResetMode(
            values.hourly_reset_mode,
          ),
          daily_limit_amount: convertSubscriptionAmountToStorageValue(
            values.daily_limit_amount,
            values.billing_mode || 'quota',
            displayAmountToQuota,
          ),
          daily_reset_mode: normalizeSubscriptionResetMode(
            values.daily_reset_mode,
          ),
          weekly_limit_amount: convertSubscriptionAmountToStorageValue(
            values.weekly_limit_amount,
            values.billing_mode || 'quota',
            displayAmountToQuota,
          ),
          weekly_reset_mode: normalizeSubscriptionResetMode(
            values.weekly_reset_mode,
          ),
          monthly_limit_amount: convertSubscriptionAmountToStorageValue(
            values.monthly_limit_amount,
            values.billing_mode || 'quota',
            displayAmountToQuota,
          ),
          monthly_reset_mode: normalizeSubscriptionResetMode(
            values.monthly_reset_mode,
          ),
        },
      };
      if (editingPlan?.plan?.id) {
        const res = await API.put(
          `/api/subscription/admin/plans/${editingPlan.plan.id}`,
          payload,
        );
        if (res.data?.success) {
          showSuccess(t('更新成功'));
          handleClose();
          refresh?.();
        } else {
          showError(res.data?.message || t('更新失败'));
        }
      } else {
        const res = await API.post('/api/subscription/admin/plans', payload);
        if (res.data?.success) {
          showSuccess(t('创建成功'));
          handleClose();
          refresh?.();
        } else {
          showError(res.data?.message || t('创建失败'));
        }
      }
    } catch (e) {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SideSheet
        placement={placement}
        title={
          <Space>
            {isEdit ? (
              <Tag color='blue' shape='circle'>
                {t('更新')}
              </Tag>
            ) : (
              <Tag color='green' shape='circle'>
                {t('新建')}
              </Tag>
            )}
            <Title heading={4} className='m-0'>
              {isEdit ? t('更新套餐信息') : t('创建新的订阅套餐')}
            </Title>
          </Space>
        }
        bodyStyle={{ padding: '0' }}
        visible={visible}
        width={isMobile ? '100%' : 600}
        footer={
          <div className='flex justify-end bg-white'>
            <Space>
              <Button
                theme='solid'
                onClick={() => formApiRef.current?.submitForm()}
                icon={<IconSave />}
                loading={loading}
              >
                {t('提交')}
              </Button>
              <Button
                theme='light'
                type='primary'
                onClick={handleClose}
                icon={<IconClose />}
              >
                {t('取消')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={handleClose}
      >
        <Spin spinning={loading}>
          <Form
            key={formKey}
            initValues={buildFormValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
          >
            {({ values }) => (
              <div className='p-2'>
                {/* 基本信息 */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconCalendarClock size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('基本信息')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('套餐的基本信息和定价')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Input
                        field='title'
                        label={t('套餐标题')}
                        placeholder={t('例如：基础套餐')}
                        required
                        rules={[
                          { required: true, message: t('请输入套餐标题') },
                        ]}
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='subtitle'
                        label={t('套餐副标题')}
                        placeholder={t('例如：适合轻度使用')}
                        showClear
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='price_amount'
                        label={t('实付金额')}
                        required
                        min={0}
                        precision={2}
                        rules={[{ required: true, message: t('请输入金额') }]}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.Select field='billing_mode' label={t('计费方式')}>
                        <Select.Option value='quota'>
                          {t('按量计费')}
                        </Select.Option>
                        <Select.Option value='request'>
                          {t('按次计费')}
                        </Select.Option>
                      </Form.Select>
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='total_amount'
                        label={
                          values.billing_mode === 'request'
                            ? t('总次数')
                            : t('总额度')
                        }
                        required
                        min={0}
                        precision={values.billing_mode === 'request' ? 0 : 2}
                        rules={[
                          {
                            required: true,
                            message:
                              values.billing_mode === 'request'
                                ? t('请输入总次数')
                                : t('请输入总额度'),
                          },
                        ]}
                        extraText={
                          values.billing_mode === 'request'
                            ? `${t('0 表示不限')} · ${t('按次数扣减订阅权益')}`
                            : `${t('0 表示不限')} · ${t('原生额度')}：${displayAmountToQuota(
                                values.total_amount,
                              )}`
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Select
                        field='allowed_groups'
                        label={t('指定分组')}
                        multiple
                        showClear
                        filter
                        showSearch
                        loading={groupLoading}
                        placeholder={t('留空表示所有分组')}
                        optionList={(groupOptions || []).map((g) => ({
                          label: g,
                          value: g,
                        }))}
                        extraText={t(
                          '仅允许这些分组使用该套餐；留空表示不限制。',
                        )}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.Select
                        field='upgrade_group'
                        label={t('升级分组')}
                        showClear
                        loading={groupLoading}
                        placeholder={t('不升级')}
                        extraText={t(
                          '购买或手动新增订阅会升级到该分组；当套餐失效/过期或手动作废/删除后，将回退到升级前分组。回退不会立即生效，通常会有几分钟延迟。',
                        )}
                      >
                        <Select.Option value=''>{t('不升级')}</Select.Option>
                        {(groupOptions || []).map((g) => (
                          <Select.Option key={g} value={g}>
                            {g}
                          </Select.Option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col span={12}>
                      <Form.Input
                        field='currency'
                        label={t('币种')}
                        disabled
                        extraText={t('由全站货币展示设置统一控制')}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='sort_order'
                        label={t('排序')}
                        precision={0}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='max_purchase_per_user'
                        label={t('购买上限')}
                        min={0}
                        precision={0}
                        extraText={t('0 表示不限')}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.Switch
                        field='enabled'
                        label={t('启用状态')}
                        size='large'
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 有效期设置 */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='green'
                      className='mr-2 shadow-md'
                    >
                      <Clock size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('有效期设置')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('配置套餐的有效时长')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Select
                        field='duration_unit'
                        label={t('有效期单位')}
                        required
                        rules={[{ required: true }]}
                      >
                        {durationUnitOptions.map((o) => (
                          <Select.Option key={o.value} value={o.value}>
                            {o.label}
                          </Select.Option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col span={12}>
                      {values.duration_unit === 'custom' ? (
                        <Form.InputNumber
                          field='custom_seconds'
                          label={t('自定义秒数')}
                          required
                          min={1}
                          precision={0}
                          rules={[{ required: true, message: t('请输入秒数') }]}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <Form.InputNumber
                          field='duration_value'
                          label={t('有效期数值')}
                          required
                          min={1}
                          precision={0}
                          rules={[{ required: true, message: t('请输入数值') }]}
                          style={{ width: '100%' }}
                        />
                      )}
                    </Col>
                  </Row>

                  {['daily', 'weekly', 'monthly'].includes(
                    values.quota_reset_period,
                  ) && (
                    <Row gutter={12}>
                      {/* Shared selector keeps quota reset and limit windows on the same cycle model. */}
                      <SubscriptionResetModeField
                        field='quota_reset_mode'
                        label={t('周期模式')}
                        value={values.quota_reset_mode}
                        t={t}
                        anchorDescription={t(
                          '订阅锚点周期：从订阅生效/上次重置时刻开始，按所选周期滚动重置',
                        )}
                        naturalDescription={t(
                          '自然周期：按自然日/周/月边界重置，如 00:00 / 周一 / 每月 1 日',
                        )}
                      />
                    </Row>
                  )}
                </Card>

                {/* 额度重置 */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='orange'
                      className='mr-2 shadow-md'
                    >
                      <RefreshCw size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('额度重置')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('支持周期性重置套餐权益额度')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Select
                        field='quota_reset_period'
                        label={t('重置周期')}
                      >
                        {resetPeriodOptions.map((o) => (
                          <Select.Option key={o.value} value={o.value}>
                            {o.label}
                          </Select.Option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col span={12}>
                      {values.quota_reset_period === 'custom' ? (
                        <Form.InputNumber
                          field='quota_reset_custom_seconds'
                          label={t('自定义秒数')}
                          required
                          min={60}
                          precision={0}
                          rules={[{ required: true, message: t('请输入秒数') }]}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <Form.InputNumber
                          field='quota_reset_custom_seconds'
                          label={t('自定义秒数')}
                          min={0}
                          precision={0}
                          style={{ width: '100%' }}
                          disabled
                        />
                      )}
                    </Col>
                  </Row>
                </Card>

                {/* 限额设置 */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconCalendarClock size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('限额设置')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('配置小时/日/周/月限制，0 表示不限制')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.InputNumber
                        field='hourly_limit_amount'
                        label={
                          values.billing_mode === 'request'
                            ? t('小时限次')
                            : t('小时限额')
                        }
                        min={0}
                        precision={values.billing_mode === 'request' ? 0 : 2}
                        placeholder='0'
                        extraText={
                          values.billing_mode === 'request'
                            ? t(
                                '每个时间段内的最大请求次数，0 表示不限制；可选自然周期或订阅锚点周期',
                              )
                            : t(
                                '每个时间段内的最大额度限制，0 表示不限制；可选自然周期或订阅锚点周期',
                              )
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>

                    {values.hourly_limit_amount > 0 && (
                      <>
                        <Col span={12}>
                          <Form.InputNumber
                            field='hourly_limit_hours'
                            label={t('小时间隔')}
                            min={1}
                            max={24}
                            precision={0}
                            placeholder='1'
                            extraText={t('如：5 表示每 5 小时重置')}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        {/* Shared selector keeps hourly reset wording aligned with other reset-capable fields. */}
                        <SubscriptionResetModeField
                          field='hourly_reset_mode'
                          label={t('周期模式')}
                          value={values.hourly_reset_mode}
                          t={t}
                          span={12}
                          anchorDescription={t(
                            '订阅锚点周期：从订阅生效/上次重置时刻开始，按设置的小时间隔滚动重置',
                          )}
                          naturalDescription={t(
                            '自然周期：按整点时间桶对齐重置，如每 5:00、10:00、15:00 重置',
                          )}
                        />
                      </>
                    )}

                    <Col span={24}>
                      <Form.InputNumber
                        field='daily_limit_amount'
                        label={
                          values.billing_mode === 'request'
                            ? t('日限次')
                            : t('日限额')
                        }
                        min={0}
                        precision={values.billing_mode === 'request' ? 0 : 2}
                        placeholder='0'
                        extraText={
                          values.billing_mode === 'request'
                            ? t(
                                '0 表示不限制；按请求次数限制，支持自然周期和订阅锚点周期',
                              )
                            : t('0 表示不限制；支持自然周期和订阅锚点周期')
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>

                    {values.daily_limit_amount > 0 && (
                      <SubscriptionResetModeField
                        field='daily_reset_mode'
                        label={
                          values.billing_mode === 'request'
                            ? t('日限次周期模式')
                            : t('日限额周期模式')
                        }
                        value={values.daily_reset_mode}
                        t={t}
                        anchorDescription={t(
                          '订阅锚点周期：从订阅生效/上次重置时刻开始，每 24 小时重置一次',
                        )}
                        naturalDescription={t(
                          '自然周期：按自然日重置，每天 00:00 自动重置',
                        )}
                      />
                    )}

                    <Col span={24}>
                      <Form.InputNumber
                        field='weekly_limit_amount'
                        label={
                          values.billing_mode === 'request'
                            ? t('周限次')
                            : t('周限额')
                        }
                        min={0}
                        precision={values.billing_mode === 'request' ? 0 : 2}
                        placeholder='0'
                        extraText={
                          values.billing_mode === 'request'
                            ? t(
                                '0 表示不限制；按请求次数限制，支持自然周期和订阅锚点周期',
                              )
                            : t('0 表示不限制；支持自然周期和订阅锚点周期')
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>

                    {values.weekly_limit_amount > 0 && (
                      <SubscriptionResetModeField
                        field='weekly_reset_mode'
                        label={
                          values.billing_mode === 'request'
                            ? t('周限次周期模式')
                            : t('周限额周期模式')
                        }
                        value={values.weekly_reset_mode}
                        t={t}
                        anchorDescription={t(
                          '订阅锚点周期：从订阅生效/上次重置时刻开始，每 7 天重置一次',
                        )}
                        naturalDescription={t(
                          '自然周期：按自然周重置，每周一 00:00 自动重置',
                        )}
                      />
                    )}

                    <Col span={24}>
                      <Form.InputNumber
                        field='monthly_limit_amount'
                        label={
                          values.billing_mode === 'request'
                            ? t('月限次')
                            : t('月限额')
                        }
                        min={0}
                        precision={values.billing_mode === 'request' ? 0 : 2}
                        placeholder='0'
                        extraText={
                          values.billing_mode === 'request'
                            ? t(
                                '0 表示不限制；按请求次数限制，支持自然周期和订阅锚点周期',
                              )
                            : t('0 表示不限制；支持自然周期和订阅锚点周期')
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>

                    {values.monthly_limit_amount > 0 && (
                      <SubscriptionResetModeField
                        field='monthly_reset_mode'
                        label={
                          values.billing_mode === 'request'
                            ? t('月限次周期模式')
                            : t('月限额周期模式')
                        }
                        value={values.monthly_reset_mode}
                        t={t}
                        anchorDescription={t(
                          '订阅锚点周期：从订阅生效/上次重置时刻开始，每 1 个月重置一次',
                        )}
                        naturalDescription={t(
                          '自然周期：按自然月重置，每月 1 日 00:00 自动重置',
                        )}
                      />
                    )}
                  </Row>
                </Card>

                {/* 第三方支付配置 */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='purple'
                      className='mr-2 shadow-md'
                    >
                      <IconCreditCard size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('第三方支付配置')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('Stripe/Creem 商品ID（可选）')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Input
                        field='stripe_price_id'
                        label='Stripe PriceId'
                        placeholder='price_...'
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='creem_product_id'
                        label='Creem ProductId'
                        placeholder='prod_...'
                        showClear
                      />
                    </Col>
                  </Row>
                </Card>
              </div>
            )}
          </Form>
        </Spin>
      </SideSheet>
    </>
  );
};

export default AddEditSubscriptionModal;
