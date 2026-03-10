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

const TIER_PRICING_EXAMPLE = [
  {
    "id": "gpt-5-long-prompt-tier-1",
    "enabled": true,
    "model_patterns": ["gpt-5*", "claude-sonnet-4*"],
    "min_prompt_tokens": 0,
    "max_prompt_tokens": 200000,
    "input_price_multiplier": 1.0,
    "output_price_multiplier": 1.0,
    "rollout_user_ids": []
  },
  {
    "id": "gpt-5-long-prompt-tier-2",
    "enabled": true,
    "model_patterns": ["gpt-5*"],
    "min_prompt_tokens": 200001,
    "max_prompt_tokens": 0,
    "input_price_multiplier": 2.0,
    "output_price_multiplier": 1.5,
    "rollout_user_ids": []
  }
];

const DEFAULT_TIER_PRICING_INPUTS = {
  'tier_pricing.enabled': false,
  'tier_pricing.rules': '[]',
};

export default function SettingTierPricingModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(DEFAULT_TIER_PRICING_INPUTS);
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(DEFAULT_TIER_PRICING_INPUTS);

  async function onSubmit() {
    await refForm.current
      .validate()
      .then(() => {
        let rulesObj = [];
        let rulesStr = inputs['tier_pricing.rules'];
        
        if (!rulesStr || rulesStr.trim() === '') {
          rulesStr = '[]';
        }

        if (!verifyJSON(rulesStr)) {
          showError(t('规则不是合法的 JSON 字符串'));
          return;
        }
        try {
          rulesObj = JSON.parse(rulesStr);
          if (!Array.isArray(rulesObj)) {
            showError(t('规则必须是 JSON 数组'));
            return;
          }
        } catch (e) {
          showError(t('规则解析失败'));
          return;
        }

        const finalInputs = {
          ...inputs,
          'tier_pricing.rules': JSON.stringify(rulesObj),
        };

        let baselineRules = inputsRow['tier_pricing.rules'] || '[]';
        if (typeof baselineRules === 'string' && baselineRules.trim() === '') {
          baselineRules = '[]';
        }
        try {
          baselineRules = JSON.stringify(JSON.parse(baselineRules));
        } catch (e) {}

        const compareRow = {
          ...inputsRow,
          'tier_pricing.rules': baselineRules,
        };

        const updateArray = compareObjects(finalInputs, compareRow);
        if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
        const requestQueue = updateArray.map((item) => {
          let value = String(finalInputs[item.key]);
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
    const currentInputs = { ...DEFAULT_TIER_PRICING_INPUTS };
    for (let key in props.options) {
      if (Object.keys(currentInputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(currentInputs);
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('模型阶梯计费')}>
            <Row>
              <Col span={16}>
                <Form.Switch
                  field={'tier_pricing.enabled'}
                  label={t('启用模型阶梯计费')}
                  size='default'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'tier_pricing.enabled': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.TextArea
                  label={t('模型阶梯计费规则')}
                  extraText={t('仅支持 JSON 数组；max_prompt_tokens=0 表示无上限，model_patterns 支持前缀通配（如 gpt-5*）')}
                  field={'tier_pricing.rules'}
                  autosize={{ minRows: 4, maxRows: 12 }}
                  trigger='blur'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'tier_pricing.rules': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Text>
                  {t('参考格式：')}
                  <br />
                  <pre style={{ backgroundColor: 'var(--semi-color-fill-0)', padding: '10px', borderRadius: '4px' }}>
                    {JSON.stringify(TIER_PRICING_EXAMPLE, null, 2)}
                  </pre>
                </Text>
              </Col>
            </Row>
          </Form.Section>

          <Row>
            <Button size='default' onClick={onSubmit}>
              {t('保存')}
            </Button>
          </Row>
        </Form>
      </Spin>
    </>
  );
}
