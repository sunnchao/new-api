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

import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  API,
  showError,
  showSuccess,
  timestamp2string,
  renderGroupOption,
  renderQuotaWithPrompt,
  getModelCategories,
  selectFilter,
} from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  SideSheet,
  Space,
  Spin,
  Typography,
  Card,
  Tag,
  Avatar,
  Form,
  Col,
  Row,
  Select,
} from '@douyinfe/semi-ui';
import {
  IconCreditCard,
  IconLink,
  IconSave,
  IconClose,
  IconKey,
  IconPlus,
  IconMinus,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../../../context/Status';
import AdminTokenOwnerSelect from './AdminTokenOwnerSelect';

const { Text, Title } = Typography;

const AdminEditTokenModal = (props) => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [backupGroups, setBackupGroups] = useState([]);
  const isEdit = props.editingToken.id !== undefined;

  const buildModelOption = (model) => {
    const categories = getModelCategories(t);
    let icon = null;
    for (const [key, category] of Object.entries(categories)) {
      if (key !== 'all' && category.filter({ model_name: model })) {
        icon = category.icon;
        break;
      }
    }

    return {
      label: (
        <span className='flex items-center gap-1'>
          {icon}
          {model}
        </span>
      ),
      value: model,
    };
  };

  const mergeOptionsByValue = (options = []) => {
    const deduped = new Map();
    options.forEach((option) => {
      const value = String(option?.value || '').trim();
      if (!value || deduped.has(value)) {
        return;
      }
      deduped.set(value, { ...option, value });
    });
    return Array.from(deduped.values());
  };

  const buildGroupOption = (group, label = group) => ({
    label,
    value: group,
  });

  const normalizeBackupGroupOrder = (groupList, primaryGroup = '') => {
    const normalized = [];
    const seen = new Set();
    const currentPrimaryGroup = (primaryGroup || '').trim();

    (groupList || []).forEach((group) => {
      const groupName = (group || '').trim();
      if (!groupName || groupName === 'auto') {
        return;
      }
      if (currentPrimaryGroup !== '' && groupName === currentPrimaryGroup) {
        return;
      }
      if (seen.has(groupName)) {
        return;
      }
      seen.add(groupName);
      normalized.push(groupName);
    });

    return normalized;
  };

  const getInitValues = () => ({
    user_id: undefined,
    user_name: '',
    name: '',
    remain_quota: 0,
    expired_time: -1,
    unlimited_quota: true,
    model_limits_enabled: false,
    model_limits: [],
    mj_model: '',
    allow_ips: '',
    group: '',
    cross_group_retry: false,
    tokenCount: 1,
    backup_group: [],
  });

  const handleCancel = () => {
    props.handleClose();
  };

  const setExpiredTime = (month, day, hour, minute) => {
    let now = new Date();
    let timestamp = now.getTime() / 1000;
    let seconds = month * 30 * 24 * 60 * 60;
    seconds += day * 24 * 60 * 60;
    seconds += hour * 60 * 60;
    seconds += minute * 60;
    if (!formApiRef.current) return;
    if (seconds !== 0) {
      timestamp += seconds;
      formApiRef.current.setValue('expired_time', timestamp2string(timestamp));
    } else {
      formApiRef.current.setValue('expired_time', -1);
    }
  };

  const loadModels = async () => {
    try {
      const res = await API.get('/api/channel/models_enabled');
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(t(message || '加载模型失败'));
        return;
      }

      const localModelOptions = (data || []).map(buildModelOption);
      setModels((prev) => mergeOptionsByValue([...localModelOptions, ...prev]));
    } catch (error) {
      showError(error?.message || t('加载模型失败'));
    }
  };

  const loadGroups = async () => {
    try {
      const res = await API.get('/api/group/');
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(t(message || '加载分组失败'));
        return;
      }

      const localGroupOptions = (data || [])
        .filter(Boolean)
        .map((group) => buildGroupOption(group))
        .sort((a, b) => String(a.value).localeCompare(String(b.value)));

      if (
        statusState?.status?.default_use_auto_group &&
        !localGroupOptions.some((group) => group.value === 'auto')
      ) {
        localGroupOptions.unshift(buildGroupOption('auto', t('智能熔断')));
      }

      setGroups((prev) => mergeOptionsByValue([...localGroupOptions, ...prev]));
    } catch (error) {
      showError(error?.message || t('加载分组失败'));
    }
  };

  const loadToken = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/token/${props.editingToken.id}`);
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(t(message || '加载令牌失败'));
        return;
      }

      const normalizedData = {
        ...data,
        allow_ips: data?.allow_ips || '',
        mj_model: data?.mj_model || '',
        group: data?.group || '',
        user_name: data?.user_name || '',
      };

      if (normalizedData.expired_time !== -1) {
        normalizedData.expired_time = timestamp2string(normalizedData.expired_time);
      }
      normalizedData.model_limits = normalizedData.model_limits
        ? normalizedData.model_limits.split(',')
        : [];
      normalizedData.backup_group = normalizeBackupGroupOrder(
        normalizedData.backup_group ? normalizedData.backup_group.split(',') : [],
        normalizedData.group,
      );

      setModels((prev) =>
        mergeOptionsByValue([
          ...prev,
          ...normalizedData.model_limits.map(buildModelOption),
        ]),
      );
      setGroups((prev) =>
        mergeOptionsByValue([
          ...prev,
          ...[normalizedData.group, ...normalizedData.backup_group]
            .filter(Boolean)
            .map((group) => buildGroupOption(group)),
        ]),
      );
      setBackupGroups(normalizedData.backup_group || []);
      formApiRef.current?.setValues({
        ...getInitValues(),
        ...normalizedData,
      });
    } catch (error) {
      showError(error?.message || t('加载令牌失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels().then();
    loadGroups().then();
    if (!isEdit) {
      formApiRef.current?.setValues(getInitValues());
      setBackupGroups([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.editingToken.id]);

  useEffect(() => {
    if (props.visiable) {
      if (isEdit) {
        loadToken().then();
      } else {
        formApiRef.current?.setValues(getInitValues());
        setBackupGroups([]);
      }
    } else {
      formApiRef.current?.reset();
      setBackupGroups([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.visiable, props.editingToken.id]);

  const handleAddBackupGroup = () => {
    setBackupGroups((prev) => [...prev, '']);
  };

  const handleBackupGroupChange = (index, value) => {
    setBackupGroups((prev) => {
      const next = [...prev];
      next[index] = value || '';
      return next;
    });
  };

  const handleRemoveBackupGroup = (index) => {
    setBackupGroups((prev) => prev.filter((_, idx) => idx !== index));
  };

  const getBackupGroupOptions = (currentIndex, currentGroup) => {
    const selectedGroups = backupGroups.filter(Boolean);
    return groups
      .filter((option) => option.value !== currentGroup)
      .filter((option) => option.value !== 'auto')
      .filter(
        (option) =>
          !selectedGroups.includes(option.value) ||
          option.value === backupGroups[currentIndex],
      );
  };

  const generateRandomSuffix = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const buildPayload = (values) => {
    const { tokenCount: _tokenCount, user_name: _userName, ...localInputs } = values;
    const parsedUserId = parseInt(localInputs.user_id, 10);
    const parsedRemainQuota = parseInt(localInputs.remain_quota, 10);
    const modelLimits = Array.isArray(localInputs.model_limits)
      ? localInputs.model_limits
      : [];

    localInputs.user_id = Number.isNaN(parsedUserId) ? undefined : parsedUserId;
    localInputs.mj_model = localInputs.mj_model || '';
    localInputs.allow_ips = localInputs.allow_ips || '';
    localInputs.group = localInputs.group || '';
    localInputs.remain_quota = Number.isNaN(parsedRemainQuota)
      ? 0
      : parsedRemainQuota;

    if (localInputs.expired_time !== -1) {
      const time = Date.parse(localInputs.expired_time);
      if (Number.isNaN(time)) {
        throw new Error(t('过期时间格式错误！'));
      }
      localInputs.expired_time = Math.ceil(time / 1000);
    }

    localInputs.model_limits = modelLimits.join(',');
    localInputs.model_limits_enabled = modelLimits.length > 0;
    localInputs.backup_group = normalizeBackupGroupOrder(
      backupGroups,
      localInputs.group,
    ).join(',');

    return localInputs;
  };

  const submit = async (values) => {
    if (!values.user_id) {
      showError(t('请选择令牌归属用户'));
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const payload = buildPayload(values);
        const res = await API.put('/api/admin/token', {
          ...payload,
          id: parseInt(props.editingToken.id, 10),
        });
        const { success, message } = res.data || {};
        if (!success) {
          showError(t(message || '令牌更新失败'));
          return;
        }

        showSuccess(t('令牌更新成功！'));
        props.refresh();
        props.handleClose();
      } else {
        const count = parseInt(values.tokenCount, 10) || 1;
        const baseName = values.name.trim() === '' ? 'default' : values.name.trim();
        let successCount = 0;

        for (let index = 0; index < count; index++) {
          const payload = buildPayload(values);
          payload.name =
            index === 0 && values.name.trim() !== ''
              ? baseName
              : `${baseName}-${generateRandomSuffix()}`;

          const res = await API.post('/api/admin/token', payload);
          const { success, message } = res.data || {};
          if (!success) {
            showError(t(message || '令牌创建失败'));
            break;
          }
          successCount++;
        }

        if (successCount > 0) {
          showSuccess(t('已成功创建 {{count}} 个令牌！', { count: successCount }));
          props.refresh();
          props.handleClose();
        }
      }
    } catch (error) {
      showError(error?.message || t('提交失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SideSheet
      placement={isEdit ? 'right' : 'left'}
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
            {isEdit ? t('更新令牌信息') : t('创建新的令牌')}
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '0' }}
      visible={props.visiable}
      width={isMobile ? '100%' : 600}
      footer={
        <div className='flex justify-end bg-white'>
          <Space>
            <Button
              theme='solid'
              className='!rounded-lg'
              onClick={() => formApiRef.current?.submitForm()}
              icon={<IconSave />}
              loading={loading}
            >
              {t('提交')}
            </Button>
            <Button
              theme='light'
              className='!rounded-lg'
              type='primary'
              onClick={handleCancel}
              icon={<IconClose />}
            >
              {t('取消')}
            </Button>
          </Space>
        </div>
      }
      closeIcon={null}
      onCancel={handleCancel}
    >
      <Spin spinning={loading}>
        <Form
          key={isEdit ? `edit-${props.editingToken.id}` : 'new'}
          initValues={getInitValues()}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
        >
          {({ values }) => (
            <div className='p-2'>
              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='blue' className='mr-2 shadow-md'>
                    <IconKey size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>{t('基本信息')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌的基本信息和归属用户')}
                    </div>
                  </div>
                </div>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Slot label={t('归属用户')}>
                      <div className='flex flex-col gap-1 w-full'>
                        <AdminTokenOwnerSelect
                          value={values.user_id}
                          ownerName={values.user_name}
                          readOnly={isEdit}
                          onChange={(nextValue, option) => {
                            formApiRef.current?.setValue('user_id', nextValue);
                            formApiRef.current?.setValue(
                              'user_name',
                              option?.username || '',
                            );
                          }}
                        />
                        <div className='text-xs text-gray-600'>
                          {isEdit
                            ? t('管理员编辑令牌时不可修改归属用户')
                            : t('创建令牌时必须先指定归属用户')}
                        </div>
                      </div>
                    </Form.Slot>
                  </Col>

                  <Col span={24}>
                    <Form.Input
                      field='name'
                      label={t('名称')}
                      placeholder={t('请输入名称')}
                      rules={[{ required: true, message: t('请输入名称') }]}
                      showClear
                    />
                  </Col>

                  <Col span={24}>
                    {groups.length > 0 ? (
                      <>
                        <Form.Select
                          field='group'
                          label={t('令牌分组')}
                          placeholder={t('令牌分组，默认使用用户默认分组')}
                          optionList={groups}
                          renderOptionItem={renderGroupOption}
                          showClear
                          style={{ width: '100%' }}
                        />

                        {values.group === 'auto' ? null : (
                          <Form.Slot label={t('备用分组')}>
                            <div className='flex flex-col gap-2 w-full'>
                              {backupGroups.map((group, index) => (
                                <div
                                  key={`${group}-${index}`}
                                  className='flex items-center gap-2 w-full'
                                >
                                  <Select
                                    value={group || undefined}
                                    placeholder={t('请选择备用分组')}
                                    optionList={getBackupGroupOptions(
                                      index,
                                      values.group,
                                    )}
                                    renderOptionItem={renderGroupOption}
                                    showClear
                                    style={{ width: '100%' }}
                                    onChange={(value) =>
                                      handleBackupGroupChange(index, value)
                                    }
                                  />
                                  <Button
                                    type='tertiary'
                                    icon={<IconMinus />}
                                    onClick={() => handleRemoveBackupGroup(index)}
                                  />
                                </div>
                              ))}
                              <Button
                                type='tertiary'
                                icon={<IconPlus />}
                                onClick={handleAddBackupGroup}
                              >
                                {t('添加备用分组')}
                              </Button>
                            </div>
                          </Form.Slot>
                        )}
                      </>
                    ) : (
                      <Form.Select
                        placeholder={t('管理员未设置用户可选分组')}
                        disabled
                        label={t('令牌分组')}
                        style={{ width: '100%' }}
                      />
                    )}
                  </Col>

                  <Col
                    span={24}
                    style={{ display: values.group === 'auto' ? 'block' : 'none' }}
                  >
                    <Form.Switch
                      field='cross_group_retry'
                      label={t('跨分组重试')}
                      size='default'
                      extraText={t(
                        '开启后，当前分组渠道失败时会按顺序尝试下一个分组的渠道',
                      )}
                    />
                  </Col>

                  <Col xs={24} sm={24} md={24} lg={10} xl={10}>
                    <Form.DatePicker
                      field='expired_time'
                      label={t('过期时间')}
                      type='dateTime'
                      placeholder={t('请选择过期时间')}
                      rules={[
                        { required: true, message: t('请选择过期时间') },
                        {
                          validator: (rule, value) => {
                            if (value === -1 || !value) return Promise.resolve();
                            const time = Date.parse(value);
                            if (Number.isNaN(time)) {
                              return Promise.reject(t('过期时间格式错误！'));
                            }
                            if (time <= Date.now()) {
                              return Promise.reject(t('过期时间不能早于当前时间！'));
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>

                  <Col xs={24} sm={24} md={24} lg={14} xl={14}>
                    <Form.Slot label={t('过期时间快捷设置')}>
                      <Space wrap>
                        <Button
                          theme='light'
                          type='primary'
                          onClick={() => setExpiredTime(0, 0, 0, 0)}
                        >
                          {t('永不过期')}
                        </Button>
                        <Button
                          theme='light'
                          type='tertiary'
                          onClick={() => setExpiredTime(1, 0, 0, 0)}
                        >
                          {t('一个月')}
                        </Button>
                        <Button
                          theme='light'
                          type='tertiary'
                          onClick={() => setExpiredTime(0, 1, 0, 0)}
                        >
                          {t('一天')}
                        </Button>
                        <Button
                          theme='light'
                          type='tertiary'
                          onClick={() => setExpiredTime(0, 0, 1, 0)}
                        >
                          {t('一小时')}
                        </Button>
                      </Space>
                    </Form.Slot>
                  </Col>

                  {!isEdit && (
                    <Col span={24}>
                      <Form.InputNumber
                        field='tokenCount'
                        label={t('新建数量')}
                        min={1}
                        extraText={t('批量创建时会在名称后自动添加随机后缀')}
                        rules={[{ required: true, message: t('请输入新建数量') }]}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>

              <Row className='mt-4' />

              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='orange' className='mr-2 shadow-md'>
                    <IconLink size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>
                      {t('Midjourney 设置')}
                    </Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌的 Midjourney 绘图模式（可选）')}
                    </div>
                  </div>
                </div>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Select
                      field='mj_model'
                      label={t('绘图模式')}
                      placeholder={t('默认 Fast')}
                      optionList={[
                        { label: t('默认（Fast）'), value: '' },
                        { label: t('Fast（出图速度很快、价格中等）'), value: 'fast' },
                        { label: t('Relax（出图速度较慢、价格较低）'), value: 'relax' },
                        { label: t('Turbo（出图速度加倍、价格最贵）'), value: 'turbo' },
                      ]}
                      extraText={t(
                        '优先级：令牌设置 > url参数 > 默认。可通过 URL 参数 mj_model=fast/relax/turbo 自定义',
                      )}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </Card>

              <Row className='mt-4' />

              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='green' className='mr-2 shadow-md'>
                    <IconCreditCard size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>{t('额度设置')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌可用额度和数量')}
                    </div>
                  </div>
                </div>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.AutoComplete
                      field='remain_quota'
                      label={t('额度')}
                      placeholder={t('请输入额度')}
                      type='number'
                      disabled={values.unlimited_quota}
                      extraText={renderQuotaWithPrompt(values.remain_quota)}
                      rules={
                        values.unlimited_quota
                          ? []
                          : [{ required: true, message: t('请输入额度') }]
                      }
                      data={[
                        { value: 500000, label: '1$' },
                        { value: 5000000, label: '10$' },
                        { value: 25000000, label: '50$' },
                        { value: 50000000, label: '100$' },
                        { value: 250000000, label: '500$' },
                        { value: 500000000, label: '1000$' },
                      ]}
                    />
                  </Col>

                  <Col span={24}>
                    <Form.Switch
                      field='unlimited_quota'
                      label={t('无限额度')}
                      size='default'
                      extraText={t(
                        '令牌的额度仅用于限制令牌本身的最大额度使用量，实际的使用受到账户的剩余额度限制',
                      )}
                    />
                  </Col>
                </Row>
              </Card>

              <Row className='mt-4' />

              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='purple' className='mr-2 shadow-md'>
                    <IconLink size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>{t('访问限制')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌的访问限制')}
                    </div>
                  </div>
                </div>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Select
                      field='model_limits'
                      label={t('模型限制列表')}
                      placeholder={t('请选择该令牌支持的模型，留空支持所有模型')}
                      multiple
                      optionList={models}
                      extraText={t('非必要，不建议启用模型限制')}
                      filter={selectFilter}
                      autoClearSearchValue={false}
                      searchPosition='dropdown'
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>

                  <Col span={24}>
                    <Form.TextArea
                      field='allow_ips'
                      label={t('IP白名单（支持CIDR表达式）')}
                      placeholder={t('允许的IP，一行一个，不填写则不限制')}
                      autosize
                      rows={1}
                      extraText={t(
                        '请勿过度信任此功能，IP可能被伪造，请配合nginx和cdn等网关使用',
                      )}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </Form>
      </Spin>
    </SideSheet>
  );
};

export default AdminEditTokenModal;
