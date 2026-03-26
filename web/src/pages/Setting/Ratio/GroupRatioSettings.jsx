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

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function GroupRatioSettings(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    GroupRatio: '',
    UserUsableGroups: '',
    UserUnselectableGroups: '',
    GroupGroupRatio: '',
    'group_ratio_setting.group_special_usable_group': '',
    GroupModelBilling: '',
    AutoGroups: '',
    DefaultUseAutoGroup: false,
  });
  const [inputsRow, setInputsRow] = useState(inputs);
  const refForm = useRef();

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const jsonRules = [
    {
      validator: (rule, value) => verifyJSON(value),
      message: t('不是合法的 JSON 字符串'),
    },
  ];

  async function onSubmit() {
    try {
      await refForm.current.validate();
      const updateArray = compareObjects(inputs, inputsRow);
      if (!updateArray.length) {
        showWarning(t('你似乎并没有修改什么'));
        return;
      }

      const requestQueue = updateArray.map((item) => {
        const value =
          typeof inputs[item.key] === 'boolean'
            ? String(inputs[item.key])
            : inputs[item.key];
        return API.put('/api/option/', { key: item.key, value });
      });

      setLoading(true);
      Promise.all(requestQueue)
        .then((res) => {
          if (res.includes(undefined)) {
            showError(
              requestQueue.length > 1
                ? t('部分保存失败，请重试')
                : t('保存失败'),
            );
            return;
          }

          for (let i = 0; i < res.length; i++) {
            if (!res[i].data.success) {
              showError(res[i].data.message);
              return;
            }
          }

          showSuccess(t('保存成功'));
          props.refresh();
        })
        .catch((error) => {
          console.error('Unexpected error:', error);
          showError(t('保存失败，请重试'));
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      showError(t('请检查输入'));
      console.error(error);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (const key in props.options) {
      if (Object.prototype.hasOwnProperty.call(inputs, key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    if (refForm.current) {
      refForm.current.setValues(currentInputs);
    }
  }, [props.options]);

  return (
    <Spin spinning={loading}>
      <Form
        values={inputs}
        getFormApi={(formAPI) => (refForm.current = formAPI)}
        style={{ marginBottom: 15 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('分组倍率')}
              placeholder={t('为一个 JSON 文本，键为分组名称，值为倍率')}
              extraText={t(
                '分组倍率设置，可在此新增或修改分组倍率。格式如 {"vip": 0.5, "test": 1}，表示 vip 分组倍率为 0.5，test 分组倍率为 1。',
              )}
              field={'GroupRatio'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={jsonRules}
              onChange={(value) => handleInputChange('GroupRatio', value)}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('用户可选分组')}
              placeholder={t('为一个 JSON 文本，键为分组名称，值为分组描述')}
              extraText={t(
                '用户创建令牌时可选的分组。格式如 {"vip": "VIP 用户", "test": "测试"}。',
              )}
              field={'UserUsableGroups'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={jsonRules}
              onChange={(value) => handleInputChange('UserUsableGroups', value)}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('用户不可选分组')}
              placeholder={t('为一个 JSON 文本，键为分组名称，值为分组描述')}
              extraText={t(
                '用户不可选分组。格式如 {"internal": "内部"}，表示普通用户不可见或不可选 internal 分组。',
              )}
              field={'UserUnselectableGroups'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={jsonRules}
              onChange={(value) =>
                handleInputChange('UserUnselectableGroups', value)
              }
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('分组特殊倍率')}
              placeholder={t('为一个 JSON 文本')}
              extraText={t(
                '键为用户分组名称，值为目标分组倍率映射。格式如 {"vip": {"default": 0.5, "test": 1}}。',
              )}
              field={'GroupGroupRatio'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={jsonRules}
              onChange={(value) => handleInputChange('GroupGroupRatio', value)}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('分组特殊可用分组')}
              placeholder={t('为一个 JSON 文本')}
              extraText={t(
                '键为用户分组名称，值为操作映射对象。支持 +:分组名 表示追加，-:分组名 表示移除，不带前缀表示直接添加。格式如 {"vip": {"+:premium": "高级分组", "special": "特殊分组", "-:default": "默认分组"}}。',
              )}
              field={'group_ratio_setting.group_special_usable_group'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={jsonRules}
              onChange={(value) =>
                handleInputChange(
                  'group_ratio_setting.group_special_usable_group',
                  value,
                )
              }
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('分组模型计费类型覆盖')}
              placeholder={t('为一个 JSON 文本')}
              extraText={
                t('允许为不同分组的模型设置按次价格覆盖，或限制资金来源。') + '\n' +
                t('• quota_type: 1=按次覆盖；0 或不设置时，仍遵循模型的全局价格模式') + '\n' +
                t('• model_price: quota_type=1 时的单次价格（美元）') + '\n' +
                t('• billing_source: 资金来源限制') + '\n' +
                t('  - "" 或不设置: 不限制，遵循用户在钱包页设置的计费偏好') + '\n' +
                t('  - "wallet_only": 仅余额') + '\n' +
                t('  - "subscription_only": 仅订阅') + '\n' +
                t('示例：{"vip": {"gpt-4": {"quota_type": 1, "model_price": 0.5, "billing_source": "subscription_only"}}}')
              }
              field={'GroupModelBilling'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={jsonRules}
              onChange={(value) => handleInputChange('GroupModelBilling', value)}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('自动分组 auto，按顺序依次尝试')}
              placeholder={t('为一个 JSON 文本')}
              field={'AutoGroups'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => {
                    if (!value || value.trim() === '') {
                      return true;
                    }
                    try {
                      const parsed = JSON.parse(value);
                      return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string');
                    } catch (error) {
                      return false;
                    }
                  },
                  message: t('必须是有效的 JSON 字符串数组，例如 ["g1", "g2"]'),
                },
              ]}
              onChange={(value) => handleInputChange('AutoGroups', value)}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Switch
              label={t(
                '创建令牌时默认选择 auto 分组，初始令牌也将设置为 auto（否则留空，使用用户默认分组）',
              )}
              field={'DefaultUseAutoGroup'}
              onChange={(value) => handleInputChange('DefaultUseAutoGroup', value)}
            />
          </Col>
        </Row>
      </Form>
      <Button onClick={onSubmit}>{t('保存分组相关设置')}</Button>
    </Spin>
  );
}
