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
import Text from '@douyinfe/semi-ui/lib/es/typography/text';

const CLAUDE_HEADER = {
  'claude-3-7-sonnet-20250219-thinking': {
    'anthropic-beta': [
      'output-128k-2025-02-19',
      'token-efficient-tools-2025-02-19',
    ],
  },
};

const CLAUDE_DEFAULT_MAX_TOKENS = {
  default: 8192,
  'claude-3-haiku-20240307': 4096,
  'claude-3-opus-20240229': 4096,
  'claude-3-7-sonnet-20250219-thinking': 8192,
};

const DEFAULT_CLAUDE_INPUTS = {
  'claude.model_headers_settings': '',
  'claude.thinking_adapter_enabled': true,
  'claude.default_max_tokens': '',
  'claude.thinking_adapter_budget_tokens_percentage': 0.8,

  // Claude long prompt pricing tier (prompt tokens > threshold)
  'claude.long_prompt_pricing_enabled': true,
  'claude.long_prompt_pricing_rollout_user_ids': '[]',
  'claude.long_prompt_pricing_threshold_tokens': 200000,
  'claude.long_prompt_pricing_input_price_multiplier': 2.0,
  'claude.long_prompt_pricing_output_price_multiplier': 1.5,
};

export default function SettingClaudeModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(DEFAULT_CLAUDE_INPUTS);
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(DEFAULT_CLAUDE_INPUTS);

  const inputMultiplier = Number(
    inputs['claude.long_prompt_pricing_input_price_multiplier'],
  );
  const outputMultiplier = Number(
    inputs['claude.long_prompt_pricing_output_price_multiplier'],
  );
  const completionRatioMultiplier =
    inputMultiplier > 0 ? outputMultiplier / inputMultiplier : NaN;
  const completionRatioMultiplierText = Number.isFinite(
    completionRatioMultiplier,
  )
    ? completionRatioMultiplier.toFixed(4)
    : '-';

  async function onSubmit() {
    await refForm.current
      .validate()
      .then(() => {
        const updateArray = compareObjects(inputs, inputsRow);
        if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
        const requestQueue = updateArray.map((item) => {
          let value = String(inputs[item.key]);

          if (
            item.key === 'claude.long_prompt_pricing_rollout_user_ids' &&
            value.trim() === ''
          ) {
            value = '[]';
          }

          return API.put('/api/option/', {
            key: item.key,
            value,
          });
        });
        setLoading(true);
        Promise.all(requestQueue)
          .then((res) => {
            if (requestQueue.length === 1) {
              if (res.includes(undefined)) return;
            } else if (requestQueue.length > 1) {
              if (res.includes(undefined))
                return showError(t('部分保存失败，请重试'));
            }
            showSuccess(t('保存成功'));
            props.refresh();
          })
          .catch(() => {
            showError(t('保存失败，请重试'));
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error('Validation failed:', error);
        showError(t('请检查输入'));
      });
  }

  useEffect(() => {
    const currentInputs = { ...DEFAULT_CLAUDE_INPUTS };
    for (let key in props.options) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_CLAUDE_INPUTS, key)) {
        currentInputs[key] = props.options[key];
      }
    }
    // Backward compatibility: legacy key before rename.
    if (
      (!props.options['claude.long_prompt_pricing_rollout_user_ids'] ||
        props.options['claude.long_prompt_pricing_rollout_user_ids'] === '') &&
      props.options['claude.long_prompt_pricing_rollout_percent']
    ) {
      currentInputs['claude.long_prompt_pricing_rollout_user_ids'] =
        props.options['claude.long_prompt_pricing_rollout_percent'];
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current?.setValues(currentInputs);
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('Claude设置')}>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Claude请求头覆盖')}
                  field={'claude.model_headers_settings'}
                  placeholder={
                    t('为一个 JSON 文本，例如：') +
                    '\n' +
                    JSON.stringify(CLAUDE_HEADER, null, 2)
                  }
                  extraText={
                    t('示例') + '\n' + JSON.stringify(CLAUDE_HEADER, null, 2)
                  }
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'claude.model_headers_settings': value,
                    })
                  }
                />
              </Col>
            </Row>

            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('缺省 MaxTokens')}
                  field={'claude.default_max_tokens'}
                  placeholder={
                    t('为一个 JSON 文本，例如：') +
                    '\n' +
                    JSON.stringify(CLAUDE_DEFAULT_MAX_TOKENS, null, 2)
                  }
                  extraText={
                    t('示例') +
                    '\n' +
                    JSON.stringify(CLAUDE_DEFAULT_MAX_TOKENS, null, 2)
                  }
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'claude.default_max_tokens': value })
                  }
                />
              </Col>
            </Row>

            <Row>
              <Col span={16}>
                <Form.Switch
                  label={t('启用Claude思考适配（-thinking后缀）')}
                  field={'claude.thinking_adapter_enabled'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'claude.thinking_adapter_enabled': value,
                    })
                  }
                />
              </Col>
            </Row>

            <Row>
              <Col span={16}>
                {/*//展示MaxTokens和BudgetTokens的计算公式, 并展示实际数字*/}
                <Text>
                  {t(
                    'Claude思考适配 BudgetTokens = MaxTokens * BudgetTokens 百分比',
                  )}
                </Text>
              </Col>
            </Row>

            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('思考适配 BudgetTokens 百分比')}
                  field={'claude.thinking_adapter_budget_tokens_percentage'}
                  initValue={''}
                  extraText={t('0.1以上的小数')}
                  min={0.1}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'claude.thinking_adapter_budget_tokens_percentage': value,
                    })
                  }
                />
              </Col>
            </Row>

            <Form.Section text={t('Claude长 Prompt 分档计费')}>
              <Row>
                <Col span={16}>
                  <Text>
                    {t(
                      '当 Prompt 总 tokens 超过阈值时，按第二阶段价格计费（支持灰度；固定价 UsePrice 模式不受影响）。',
                    )}
                  </Text>
                </Col>
              </Row>

              <Row>
                <Col span={16}>
                  <Form.Switch
                    label={t('启用长 Prompt 分档')}
                    field={'claude.long_prompt_pricing_enabled'}
                    onChange={(value) =>
                      setInputs({
                        ...inputs,
                        'claude.long_prompt_pricing_enabled': value,
                      })
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.TextArea
                    label={t('灰度白名单 (User IDs)')}
                    field={'claude.long_prompt_pricing_rollout_user_ids'}
                    placeholder={'[1, 2, 3]'}
                    extraText={t(
                      '仅对白名单用户生效（直接匹配 user_id）；为空则不生效',
                    )}
                    autosize={{ minRows: 2, maxRows: 6 }}
                    trigger='blur'
                    stopValidateWithError
                    rules={[
                      {
                        validator: (rule, value) => {
                          if (value === '') return true;
                          if (!verifyJSON(value)) return false;
                          try {
                            const parsed = JSON.parse(value);
                            return (
                              Array.isArray(parsed) &&
                              parsed.every((v) => Number.isInteger(v))
                            );
                          } catch (e) {
                            return false;
                          }
                        },
                        message: t('不是合法的 JSON 字符串'),
                      },
                    ]}
                    onChange={(value) =>
                      setInputs({
                        ...inputs,
                        'claude.long_prompt_pricing_rollout_user_ids': value,
                      })
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.InputNumber
                    label={t('触发阈值 (Tokens)')}
                    field={'claude.long_prompt_pricing_threshold_tokens'}
                    min={1}
                    extraText={t('例如 200000 代表 >200K tokens 触发第二阶段')}
                    onChange={(value) =>
                      setInputs({
                        ...inputs,
                        'claude.long_prompt_pricing_threshold_tokens': value,
                      })
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.InputNumber
                    label={t('输入价格倍率')}
                    field={'claude.long_prompt_pricing_input_price_multiplier'}
                    min={0.0001}
                    step={0.01}
                    extraText={t('官方示例：输入 x2')}
                    onChange={(value) =>
                      setInputs({
                        ...inputs,
                        'claude.long_prompt_pricing_input_price_multiplier':
                          value,
                      })
                    }
                  />
                </Col>

                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.InputNumber
                    label={t('输出价格倍率')}
                    field={'claude.long_prompt_pricing_output_price_multiplier'}
                    min={0.0001}
                    step={0.01}
                    extraText={t('官方示例：输出 x1.5')}
                    onChange={(value) =>
                      setInputs({
                        ...inputs,
                        'claude.long_prompt_pricing_output_price_multiplier':
                          value,
                      })
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col span={24}>
                  <Text type='tertiary'>
                    {t('输出补全倍率额外系数 (output/input) = ')}
                    {completionRatioMultiplierText}
                    {'  (示例: 1.5/2.0 = 0.75)'}
                  </Text>
                </Col>
              </Row>
            </Form.Section>

            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('保存')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
