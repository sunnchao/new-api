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

import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  TagInput,
  TextArea,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconCode,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess, showWarning, verifyJSON } from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const DEFAULT_TIER = {
  min_prompt_tokens: 0,
  max_prompt_tokens: 0,
  input_price_multiplier: 1.0,
  output_price_multiplier: 1.0,
  cache_read_price_multiplier: 1.0,
};

const TIER_PRICING_EXAMPLE = [
  {
    id: 'gpt-5-tier-1',
    enabled: true,
    model_pattern: 'gpt-5*',
    min_prompt_tokens: 0,
    max_prompt_tokens: 200000,
    input_price_multiplier: 1.0,
    output_price_multiplier: 1.0,
    cache_read_price_multiplier: 1.0,
    rollout_user_ids: [],
  },
  {
    id: 'gpt-5-tier-2',
    enabled: true,
    model_pattern: 'gpt-5*',
    min_prompt_tokens: 200001,
    max_prompt_tokens: 0,
    input_price_multiplier: 2.0,
    output_price_multiplier: 1.5,
    cache_read_price_multiplier: 1.5,
    rollout_user_ids: [],
  },
];

export default function TierPricingVisualEditor(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState([]);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonValue, setJsonValue] = useState('[]');

  // Modal states
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [editingModelPattern, setEditingModelPattern] = useState('');
  const [editingTiers, setEditingTiers] = useState([]);
  const [editingRolloutUserIds, setEditingRolloutUserIds] = useState([]);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [originalModelPattern, setOriginalModelPattern] = useState('');

  // Expanded model groups
  const [expandedModels, setExpandedModels] = useState(new Set());

  useEffect(() => {
    if (props.options) {
      setEnabled(
        props.options['tier_pricing.enabled'] === true ||
          props.options['tier_pricing.enabled'] === 'true'
      );
      const rulesStr = props.options['tier_pricing.rules'] || '[]';
      try {
        let parsed = JSON.parse(rulesStr);
        if (Array.isArray(parsed)) {
          // Normalize: convert model_patterns array to model_pattern string
          parsed = parsed.map((rule) => {
            if (rule.model_patterns && Array.isArray(rule.model_patterns)) {
              return {
                ...rule,
                model_pattern: rule.model_patterns[0] || '',
                cache_read_price_multiplier: rule.cache_read_price_multiplier ?? 1.0,
              };
            }
            return {
              ...rule,
              cache_read_price_multiplier: rule.cache_read_price_multiplier ?? 1.0,
            };
          });
          setRules(parsed);
          setJsonValue(JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        setRules([]);
        setJsonValue('[]');
      }
    }
  }, [props.options]);

  // Group rules by model_pattern
  const groupedRules = useMemo(() => {
    const groups = {};
    rules.forEach((rule, index) => {
      const pattern = rule.model_pattern || rule.model_patterns?.[0] || 'unknown';
      if (!groups[pattern]) {
        groups[pattern] = {
          pattern,
          rules: [],
          enabled: true,
          rollout_user_ids: rule.rollout_user_ids || [],
        };
      }
      groups[pattern].rules.push({ ...rule, _index: index });
      // If any rule is disabled, mark group as disabled
      if (!rule.enabled) {
        groups[pattern].enabled = false;
      }
    });

    // Sort rules within each group by min_prompt_tokens
    Object.values(groups).forEach((group) => {
      group.rules.sort((a, b) => a.min_prompt_tokens - b.min_prompt_tokens);
    });

    return Object.values(groups).sort((a, b) => a.pattern.localeCompare(b.pattern));
  }, [rules]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert back to model_patterns array format for backend compatibility
      const rulesForBackend = rules.map((rule) => ({
        ...rule,
        model_patterns: [rule.model_pattern || rule.model_patterns?.[0] || ''],
      }));

      const requests = [
        API.put('/api/option/', {
          key: 'tier_pricing.enabled',
          value: String(enabled),
        }),
        API.put('/api/option/', {
          key: 'tier_pricing.rules',
          value: JSON.stringify(rulesForBackend),
        }),
      ];
      const results = await Promise.all(requests);
      if (results.some((r) => r === undefined)) {
        showError(t('部分保存失败，请重试'));
      } else {
        showSuccess(t('保存成功'));
        props.refresh?.();
      }
    } catch (e) {
      showError(t('保存失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = () => {
    setEditingModelPattern('');
    setEditingTiers([{ ...DEFAULT_TIER }]);
    setEditingRolloutUserIds([]);
    setIsEditingExisting(false);
    setOriginalModelPattern('');
    setModelModalVisible(true);
  };

  const handleEditModel = (group) => {
    setEditingModelPattern(group.pattern);
    setOriginalModelPattern(group.pattern);
    setEditingTiers(
      group.rules.map((rule) => ({
        min_prompt_tokens: rule.min_prompt_tokens,
        max_prompt_tokens: rule.max_prompt_tokens,
        input_price_multiplier: rule.input_price_multiplier,
        output_price_multiplier: rule.output_price_multiplier,
        cache_read_price_multiplier: rule.cache_read_price_multiplier ?? 1.0,
      }))
    );
    setEditingRolloutUserIds(group.rollout_user_ids || []);
    setIsEditingExisting(true);
    setModelModalVisible(true);
  };

  const handleDeleteModel = (pattern) => {
    const newRules = rules.filter(
      (rule) => (rule.model_pattern || rule.model_patterns?.[0]) !== pattern
    );
    setRules(newRules);
    setJsonValue(JSON.stringify(newRules, null, 2));
  };

  const handleToggleModel = (pattern, value) => {
    const newRules = rules.map((rule) => {
      if ((rule.model_pattern || rule.model_patterns?.[0]) === pattern) {
        return { ...rule, enabled: value };
      }
      return rule;
    });
    setRules(newRules);
    setJsonValue(JSON.stringify(newRules, null, 2));
  };

  const handleDuplicateModel = (group) => {
    const newPattern = `${group.pattern}-copy`;
    const newRules = group.rules.map((rule, idx) => ({
      ...rule,
      id: `${newPattern}-tier-${idx + 1}-${Date.now()}`,
      model_pattern: newPattern,
      model_patterns: [newPattern],
    }));
    setRules([...rules, ...newRules]);
    setJsonValue(JSON.stringify([...rules, ...newRules], null, 2));
  };

  const handleSaveModel = () => {
    if (!editingModelPattern.trim()) {
      showWarning(t('模型名称不能为空'));
      return;
    }

    if (editingTiers.length === 0) {
      showWarning(t('请至少添加一个阶梯'));
      return;
    }

    // Validate tiers
    for (let i = 0; i < editingTiers.length; i++) {
      const tier = editingTiers[i];
      if (tier.input_price_multiplier < 0 || tier.output_price_multiplier < 0 || tier.cache_read_price_multiplier < 0) {
        showWarning(t('价格倍率不能为负数'));
        return;
      }
    }

    // Sort tiers by min_prompt_tokens
    const sortedTiers = [...editingTiers].sort(
      (a, b) => a.min_prompt_tokens - b.min_prompt_tokens
    );

    // Generate new rules
    const newModelRules = sortedTiers.map((tier, idx) => ({
      id: `${editingModelPattern}-tier-${idx + 1}-${Date.now()}`,
      enabled: true,
      model_pattern: editingModelPattern,
      model_patterns: [editingModelPattern],
      min_prompt_tokens: tier.min_prompt_tokens,
      max_prompt_tokens: tier.max_prompt_tokens,
      input_price_multiplier: tier.input_price_multiplier,
      output_price_multiplier: tier.output_price_multiplier,
      cache_read_price_multiplier: tier.cache_read_price_multiplier,
      rollout_user_ids: editingRolloutUserIds,
    }));

    let newRules;
    if (isEditingExisting) {
      // Remove old rules for this model
      newRules = rules.filter(
        (rule) => (rule.model_pattern || rule.model_patterns?.[0]) !== originalModelPattern
      );
      newRules = [...newRules, ...newModelRules];
    } else {
      // Check if model already exists
      const exists = rules.some(
        (rule) => (rule.model_pattern || rule.model_patterns?.[0]) === editingModelPattern
      );
      if (exists) {
        showWarning(t('该模型已存在阶梯配置'));
        return;
      }
      newRules = [...rules, ...newModelRules];
    }

    setRules(newRules);
    setJsonValue(JSON.stringify(newRules, null, 2));
    setModelModalVisible(false);
  };

  const handleAddTier = () => {
    const lastTier = editingTiers[editingTiers.length - 1];
    const newMinTokens = lastTier ? (lastTier.max_prompt_tokens || lastTier.min_prompt_tokens + 100000) + 1 : 0;
    setEditingTiers([
      ...editingTiers,
      {
        ...DEFAULT_TIER,
        min_prompt_tokens: newMinTokens,
      },
    ]);
  };

  const handleRemoveTier = (index) => {
    const newTiers = [...editingTiers];
    newTiers.splice(index, 1);
    setEditingTiers(newTiers);
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...editingTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setEditingTiers(newTiers);
  };

  const handleJsonChange = (value) => {
    setJsonValue(value);
  };

  const handleApplyJson = () => {
    if (!verifyJSON(jsonValue)) {
      showError(t('规则不是合法的 JSON 字符串'));
      return;
    }
    try {
      let parsed = JSON.parse(jsonValue);
      if (!Array.isArray(parsed)) {
        showError(t('规则必须是 JSON 数组'));
        return;
      }
      // Normalize
      parsed = parsed.map((rule) => {
        if (rule.model_patterns && Array.isArray(rule.model_patterns)) {
          return {
            ...rule,
            model_pattern: rule.model_patterns[0] || '',
            cache_read_price_multiplier: rule.cache_read_price_multiplier ?? 1.0,
          };
        }
        return {
          ...rule,
          cache_read_price_multiplier: rule.cache_read_price_multiplier ?? 1.0,
        };
      });
      setRules(parsed);
      showSuccess(t('应用成功'));
    } catch (e) {
      showError(t('规则解析失败'));
    }
  };

  const toggleExpand = (pattern) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(pattern)) {
      newExpanded.delete(pattern);
    } else {
      newExpanded.add(pattern);
    }
    setExpandedModels(newExpanded);
  };

  const formatTokenRange = (min, max) => {
    const formatNum = (n) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return n.toString();
    };
    if (max === 0) {
      return `${formatNum(min)}+`;
    }
    return `${formatNum(min)} - ${formatNum(max)}`;
  };

  const renderTierBadges = (tiers) => {
    return (
      <Space spacing={4} wrap>
        {tiers.map((tier, idx) => (
          <Tag key={idx} color="blue" size="small">
            {formatTokenRange(tier.min_prompt_tokens, tier.max_prompt_tokens)}
          </Tag>
        ))}
      </Space>
    );
  };

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '16px 0' }}>
        {/* Header Controls */}
        <Row style={{ marginBottom: 16 }} type="flex" align="middle" justify="space-between">
          <Col>
            <Space>
              <Text strong>{t('启用模型阶梯计费')}</Text>
              <Switch checked={enabled} onChange={setEnabled} />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<IconCode />}
                onClick={() => setShowJsonEditor(!showJsonEditor)}
                theme={showJsonEditor ? 'solid' : 'light'}
              >
                {t('JSON 编辑')}
              </Button>
              <Button icon={<IconPlus />} onClick={handleAddModel}>
                {t('添加模型')}
              </Button>
              <Button type="primary" onClick={handleSave}>
                {t('保存配置')}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* JSON Editor */}
        {showJsonEditor && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{t('JSON 配置')}</Text>
              <Text type="tertiary" style={{ marginLeft: 8 }}>
                {t('直接编辑 JSON 配置，适合高级用户')}
              </Text>
            </div>
            <TextArea
              value={jsonValue}
              onChange={handleJsonChange}
              autosize={{ minRows: 6, maxRows: 16 }}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ marginTop: 8 }}>
              <Space>
                <Button size="small" onClick={handleApplyJson}>
                  {t('应用 JSON')}
                </Button>
                <Text type="tertiary" size="small">
                  {t('提示：编辑后点击"应用 JSON"更新可视化列表，然后点击"保存配置"提交')}
                </Text>
              </Space>
            </div>
            <Collapse style={{ marginTop: 12 }}>
              <Collapse.Panel header={t('参考格式')} itemKey="example">
                <pre
                  style={{
                    backgroundColor: 'var(--semi-color-fill-0)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: 12,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(TIER_PRICING_EXAMPLE, null, 2)}
                </pre>
              </Collapse.Panel>
            </Collapse>
          </Card>
        )}

        {/* Model Groups List */}
        <Card>
          {groupedRules.length === 0 ? (
            <Empty
              title={t('暂无阶梯计费规则')}
              description={t('点击上方"添加模型"按钮添加阶梯计费规则')}
            />
          ) : (
            <div>
              {groupedRules.map((group) => {
                const isExpanded = expandedModels.has(group.pattern);
                return (
                  <Card
                    key={group.pattern}
                    style={{ marginBottom: 12 }}
                    bodyStyle={{ padding: 0 }}
                  >
                    {/* Model Header */}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: 'var(--semi-color-fill-0)',
                      }}
                      onClick={() => toggleExpand(group.pattern)}
                    >
                      <Space>
                        {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                        <Switch
                          size="small"
                          checked={group.enabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(value) => handleToggleModel(group.pattern, value)}
                        />
                        <Text strong style={{ fontSize: 14 }}>
                          {group.pattern}
                        </Text>
                        <Text type="tertiary">
                          ({group.rules.length} {t('个阶梯')})
                        </Text>
                        {!isExpanded && renderTierBadges(group.rules)}
                      </Space>
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Tooltip content={t('编辑')}>
                          <Button
                            icon={<IconEdit />}
                            size="small"
                            theme="borderless"
                            onClick={() => handleEditModel(group)}
                          />
                        </Tooltip>
                        <Tooltip content={t('复制')}>
                          <Button
                            icon={<IconCopy />}
                            size="small"
                            theme="borderless"
                            onClick={() => handleDuplicateModel(group)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title={t('确认删除')}
                          content={t('确定要删除该模型的所有阶梯配置吗？')}
                          onConfirm={() => handleDeleteModel(group.pattern)}
                        >
                          <Tooltip content={t('删除')}>
                            <Button
                              icon={<IconDelete />}
                              size="small"
                              theme="borderless"
                              type="danger"
                            />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    </div>

                    {/* Tiers Table */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px' }}>
                        <Table
                          columns={[
                            {
                              title: t('Token 范围'),
                              dataIndex: 'token_range',
                              width: 150,
                              render: (_, record) =>
                                formatTokenRange(
                                  record.min_prompt_tokens,
                                  record.max_prompt_tokens
                                ),
                            },
                            {
                              title: t('输入倍率'),
                              dataIndex: 'input_price_multiplier',
                              width: 100,
                              render: (v) => `${v}x`,
                            },
                            {
                              title: t('输出倍率'),
                              dataIndex: 'output_price_multiplier',
                              width: 100,
                              render: (v) => `${v}x`,
                            },
                            {
                              title: t('缓存读取倍率'),
                              dataIndex: 'cache_read_price_multiplier',
                              width: 120,
                              render: (v) => `${v ?? 1.0}x`,
                            },
                          ]}
                          dataSource={group.rules}
                          pagination={false}
                          size="small"
                          rowKey="_index"
                        />
                        {group.rollout_user_ids?.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="tertiary" size="small">
                              {t('灰度用户')}: {group.rollout_user_ids.join(', ')}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Help */}
        <Card style={{ marginTop: 16 }}>
          <Title heading={6}>{t('配置说明')}</Title>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>{t('模型名称支持通配符，如 gpt-5* 匹配所有以 gpt-5 开头的模型')}</li>
            <li>{t('max_prompt_tokens=0 表示无上限')}</li>
            <li>{t('价格倍率 1.0 表示原价，2.0 表示两倍价格')}</li>
            <li>{t('灰度用户 ID 留空表示对所有用户生效')}</li>
          </ul>
        </Card>
      </div>

      {/* Add/Edit Model Modal */}
      <Modal
        title={isEditingExisting ? t('编辑模型阶梯') : t('添加模型阶梯')}
        visible={modelModalVisible}
        onCancel={() => setModelModalVisible(false)}
        onOk={handleSaveModel}
        width={800}
        okText={t('确定')}
        cancelText={t('取消')}
      >
        <Form labelPosition="top" style={{ padding: '16px 0' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Slot label={t('模型名称')}>
                <Input
                  value={editingModelPattern}
                  onChange={setEditingModelPattern}
                  placeholder={t('输入模型名称或通配符，如 gpt-5*')}
                  disabled={isEditingExisting}
                />
              </Form.Slot>
            </Col>
            <Col span={12}>
              <Form.Slot label={t('灰度用户 ID')}>
                <TagInput
                  value={editingRolloutUserIds.map((id) => String(id))}
                  onChange={(value) =>
                    setEditingRolloutUserIds(value.map((v) => parseInt(v, 10) || v))
                  }
                  placeholder={t('留空表示全部用户')}
                  style={{ width: '100%' }}
                  size={'small'}
                />
              </Form.Slot>
            </Col>
          </Row>

          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <Space>
              <Text strong>{t('阶梯配置')}</Text>
              <Button size="small" icon={<IconPlus />} onClick={handleAddTier}>
                {t('添加阶梯')}
              </Button>
            </Space>
          </div>

          <Table
            columns={[
              {
                title: t('最小 Token'),
                dataIndex: 'min_prompt_tokens',
                width: 130,
                render: (value, record, index) => (
                  <InputNumber
                    value={value}
                    onChange={(v) => handleTierChange(index, 'min_prompt_tokens', v || 0)}
                    min={0}
                    style={{ width: '100%' }}
                    hideButtons
                  />
                ),
              },
              {
                title: t('最大 Token'),
                dataIndex: 'max_prompt_tokens',
                width: 130,
                render: (value, record, index) => (
                  <InputNumber
                    value={value}
                    onChange={(v) => handleTierChange(index, 'max_prompt_tokens', v || 0)}
                    min={0}
                    placeholder="0=无上限"
                    style={{ width: '100%' }}
                    hideButtons
                  />
                ),
              },
              {
                title: t('输入倍率'),
                dataIndex: 'input_price_multiplier',
                width: 100,
                render: (value, record, index) => (
                  <InputNumber
                    value={value}
                    onChange={(v) => handleTierChange(index, 'input_price_multiplier', v ?? 1.0)}
                    min={0}
                    step={0.1}
                    precision={2}
                    style={{ width: '100%' }}
                    hideButtons
                  />
                ),
              },
              {
                title: t('输出倍率'),
                dataIndex: 'output_price_multiplier',
                width: 100,
                render: (value, record, index) => (
                  <InputNumber
                    value={value}
                    onChange={(v) => handleTierChange(index, 'output_price_multiplier', v ?? 1.0)}
                    min={0}
                    step={0.1}
                    precision={2}
                    style={{ width: '100%' }}
                    hideButtons
                  />
                ),
              },
              {
                title: t('缓存读取倍率'),
                dataIndex: 'cache_read_price_multiplier',
                width: 120,
                render: (value, record, index) => (
                  <InputNumber
                    value={value ?? 1.0}
                    onChange={(v) => handleTierChange(index, 'cache_read_price_multiplier', v ?? 1.0)}
                    min={0}
                    step={0.1}
                    precision={2}
                    style={{ width: '100%' }}
                    hideButtons
                  />
                ),
              },
              {
                title: t('操作'),
                dataIndex: 'actions',
                width: 60,
                render: (_, record, index) => (
                  <Button
                    icon={<IconDelete />}
                    size="small"
                    theme="borderless"
                    type="danger"
                    disabled={editingTiers.length <= 1}
                    onClick={() => handleRemoveTier(index)}
                  />
                ),
              },
            ]}
            dataSource={editingTiers}
            pagination={false}
            size="small"
            rowKey={(_, index) => index}
          />

          <div style={{ marginTop: 12 }}>
            <Text type="tertiary" size="small">
              {t('提示：max_prompt_tokens 设为 0 表示无上限；阶梯会按 min_prompt_tokens 自动排序')}
            </Text>
          </div>
        </Form>
      </Modal>
    </Spin>
  );
}
