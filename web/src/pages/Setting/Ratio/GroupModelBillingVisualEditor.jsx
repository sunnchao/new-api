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

import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  Radio,
  RadioGroup,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IconDelete, IconSave, IconSearch } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

import { API, showError, showSuccess, showWarning } from '../../../helpers';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

const { Text } = Typography;

const DEFAULT_ENTRY = Object.freeze({
  mode: 'inherit',
  modelPrice: '',
  billingSource: '',
});

const NUMERIC_INPUT_REGEX = /^(\d+(\.\d*)?|\.\d*)?$/;

const parseOptionJSON = (rawValue) => {
  if (!rawValue || rawValue.trim() === '') {
    return {};
  }
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('JSON parse failed:', error);
    return {};
  }
};

const hasValue = (value) =>
  value !== undefined && value !== null && value !== '';

const toNumericString = (value) => {
  if (!hasValue(value) && value !== 0) {
    return '';
  }
  const num = Number(value);
  return Number.isFinite(num) ? `${parseFloat(num.toFixed(12))}` : '';
};

const toNumberOrNull = (value) => {
  if (!hasValue(value) && value !== 0) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const sortObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject(value[key]);
      return acc;
    }, {});
};

const formatGroupLabel = (groupName, groupLabel) => {
  if (!groupLabel || groupLabel === groupName) {
    return groupName;
  }
  return `${groupLabel} (${groupName})`;
};

const formatPrice = (value) => {
  const num = toNumberOrNull(value);
  if (num === null) {
    return '-';
  }
  return `$${parseFloat(num.toFixed(6))}/call`;
};

const getBillingSourceTag = (billingSource) => {
  switch (billingSource) {
    case 'wallet_only':
      return {
        color: 'orange',
        text: 'Wallet only',
      };
    case 'subscription_only':
      return {
        color: 'indigo',
        text: 'Subscription only',
      };
    default:
      return {
        color: 'grey',
        text: 'Follow user preference',
      };
  }
};

const getLegacyBillingOption = (billingSource) => {
  if (
    !billingSource ||
    ['wallet_only', 'subscription_only'].includes(billingSource)
  ) {
    return null;
  }
  return {
    value: billingSource,
    label: `Legacy value: ${billingSource}`,
  };
};

const parseBillingDraft = (rawValue) => {
  const parsed = parseOptionJSON(rawValue);
  const result = {};

  Object.entries(parsed).forEach(([groupName, groupModels]) => {
    if (
      !groupModels ||
      typeof groupModels !== 'object' ||
      Array.isArray(groupModels)
    ) {
      return;
    }

    Object.entries(groupModels).forEach(([modelName, config]) => {
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return;
      }

      const billingSource = `${config.billing_source || ''}`.trim();
      const mode = Number(config.quota_type) === 1 ? 'per-request' : 'inherit';
      const modelPrice =
        Number(config.quota_type) === 1
          ? toNumericString(config.model_price)
          : '';

      if (mode === 'inherit' && !billingSource) {
        return;
      }

      if (!result[groupName]) {
        result[groupName] = {};
      }

      result[groupName][modelName] = {
        mode,
        modelPrice,
        billingSource,
      };
    });
  });

  return result;
};

const buildGroupOptions = ({
  groupRatioMap,
  userUsableGroupsMap,
  userUnselectableGroupsMap,
  billingDraft,
}) => {
  const allGroupNames = new Set([
    ...Object.keys(groupRatioMap),
    ...Object.keys(userUsableGroupsMap),
    ...Object.keys(userUnselectableGroupsMap),
    ...Object.keys(billingDraft),
  ]);

  return Array.from(allGroupNames)
    .sort((a, b) => a.localeCompare(b))
    .map((groupName) => {
      const groupLabel =
        userUsableGroupsMap[groupName] ||
        userUnselectableGroupsMap[groupName] ||
        '';
      return {
        value: groupName,
        label: formatGroupLabel(groupName, groupLabel),
      };
    });
};

const buildGlobalModelMap = ({
  pricingModels,
  modelPriceMap,
  modelRatioMap,
  billingDraft,
}) => {
  const map = new Map();

  pricingModels.forEach((model) => {
    map.set(model.model_name, {
      name: model.model_name,
      enableGroups: Array.isArray(model.enable_groups)
        ? model.enable_groups
        : [],
      quotaType: Number(model.quota_type) === 1 ? 1 : 0,
      modelPrice: toNumericString(model.model_price),
      modelRatio: toNumericString(model.model_ratio),
    });
  });

  Object.keys(modelPriceMap).forEach((modelName) => {
    const current = map.get(modelName) || {
      name: modelName,
      enableGroups: [],
      quotaType: 1,
      modelPrice: '',
      modelRatio: '',
    };
    current.quotaType = 1;
    current.modelPrice = toNumericString(modelPriceMap[modelName]);
    map.set(modelName, current);
  });

  Object.keys(modelRatioMap).forEach((modelName) => {
    const current = map.get(modelName) || {
      name: modelName,
      enableGroups: [],
      quotaType: 0,
      modelPrice: '',
      modelRatio: '',
    };
    if (!hasValue(current.modelPrice)) {
      current.quotaType = 0;
    }
    current.modelRatio = toNumericString(modelRatioMap[modelName]);
    map.set(modelName, current);
  });

  Object.values(billingDraft).forEach((groupModels) => {
    Object.keys(groupModels || {}).forEach((modelName) => {
      if (!map.has(modelName)) {
        map.set(modelName, {
          name: modelName,
          enableGroups: [],
          quotaType: null,
          modelPrice: '',
          modelRatio: '',
        });
      }
    });
  });

  return map;
};

const getGlobalSummary = (modelInfo) => {
  if (!modelInfo) {
    return {
      text: 'Global pricing not found',
      tagColor: 'grey',
      tagText: 'Unknown',
    };
  }

  if (modelInfo.quotaType === 1) {
    return {
      text: `Global per-request ${formatPrice(modelInfo.modelPrice)}`,
      tagColor: 'teal',
      tagText: 'Per request',
    };
  }

  if (modelInfo.quotaType === 0) {
    const ratioText = hasValue(modelInfo.modelRatio)
      ? `Ratio ${modelInfo.modelRatio}`
      : 'Per token';
    return {
      text: `Global per-token | ${ratioText}`,
      tagColor: 'violet',
      tagText: 'Per token',
    };
  }

  return {
    text: 'Global pricing not found',
    tagColor: 'grey',
    tagText: 'Unknown',
  };
};

const getOverrideSummary = (entry) => {
  if (!entry) {
    return {
      text: 'Follow global pricing and user preference',
      tagColor: 'grey',
      tagText: 'No override',
    };
  }

  const sourceTag = getBillingSourceTag(entry.billingSource);
  if (entry.mode === 'per-request') {
    return {
      text: `Per-request override ${formatPrice(entry.modelPrice)} | ${sourceTag.text}`,
      tagColor: 'teal',
      tagText: 'Per request',
    };
  }

  return {
    text: `Follow global pricing | ${sourceTag.text}`,
    tagColor: 'blue',
    tagText: 'Source only',
  };
};

const serializeBillingDraft = (billingDraft) => {
  const result = {};

  for (const [groupName, groupModels] of Object.entries(billingDraft)) {
    for (const [modelName, entry] of Object.entries(groupModels || {})) {
      const mode = entry?.mode === 'per-request' ? 'per-request' : 'inherit';
      const billingSource = `${entry?.billingSource || ''}`.trim();

      if (mode === 'inherit' && !billingSource) {
        continue;
      }

      if (!result[groupName]) {
        result[groupName] = {};
      }

      if (mode === 'per-request') {
        const modelPrice = toNumberOrNull(entry?.modelPrice);
        if (modelPrice === null || modelPrice < 0) {
          throw new Error(
            `Group ${groupName} model ${modelName} is missing a valid per-request price`,
          );
        }
        result[groupName][modelName] = {
          quota_type: 1,
          model_price: modelPrice,
        };
      } else {
        result[groupName][modelName] = {
          quota_type: 0,
        };
      }

      if (billingSource) {
        result[groupName][modelName].billing_source = billingSource;
      }
    }

    if (result[groupName] && Object.keys(result[groupName]).length === 0) {
      delete result[groupName];
    }
  }

  return sortObject(result);
};

export default function GroupModelBillingVisualEditor({ options, refresh }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricingModels, setPricingModels] = useState([]);
  const [billingDraft, setBillingDraft] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedModelName, setSelectedModelName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [overrideOnly, setOverrideOnly] = useState(false);

  const groupRatioMap = useMemo(
    () => parseOptionJSON(options.GroupRatio),
    [options.GroupRatio],
  );
  const userUsableGroupsMap = useMemo(
    () => parseOptionJSON(options.UserUsableGroups),
    [options.UserUsableGroups],
  );
  const userUnselectableGroupsMap = useMemo(
    () => parseOptionJSON(options.UserUnselectableGroups),
    [options.UserUnselectableGroups],
  );
  const modelPriceMap = useMemo(
    () => parseOptionJSON(options.ModelPrice),
    [options.ModelPrice],
  );
  const modelRatioMap = useMemo(
    () => parseOptionJSON(options.ModelRatio),
    [options.ModelRatio],
  );
  const originalPersistedValue = useMemo(
    () => sortObject(parseOptionJSON(options.GroupModelBilling)),
    [options.GroupModelBilling],
  );

  useEffect(() => {
    setBillingDraft(parseBillingDraft(options.GroupModelBilling));
  }, [options.GroupModelBilling]);

  useEffect(() => {
    let mounted = true;

    const loadPricing = async () => {
      setLoading(true);
      try {
        const res = await API.get('/api/pricing');
        if (!mounted) {
          return;
        }
        if (res.data?.success) {
          setPricingModels(Array.isArray(res.data.data) ? res.data.data : []);
        } else {
          showError(res.data?.message || 'Failed to load models');
        }
      } catch (error) {
        if (mounted) {
          showError('Failed to load models');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPricing();

    return () => {
      mounted = false;
    };
  }, []);

  const groupOptions = useMemo(
    () =>
      buildGroupOptions({
        groupRatioMap,
        userUsableGroupsMap,
        userUnselectableGroupsMap,
        billingDraft,
      }),
    [billingDraft, groupRatioMap, userUnselectableGroupsMap, userUsableGroupsMap],
  );

  useEffect(() => {
    if (groupOptions.length === 0) {
      setSelectedGroup('');
      return;
    }

    if (!groupOptions.some((item) => item.value === selectedGroup)) {
      setSelectedGroup(groupOptions[0].value);
    }
  }, [groupOptions, selectedGroup]);

  const globalModelMap = useMemo(
    () =>
      buildGlobalModelMap({
        pricingModels,
        modelPriceMap,
        modelRatioMap,
        billingDraft,
      }),
    [billingDraft, modelPriceMap, modelRatioMap, pricingModels],
  );

  const groupRows = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    const candidateModelNames = new Set(
      Object.keys(billingDraft[selectedGroup] || {}),
    );

    pricingModels.forEach((model) => {
      const enableGroups = Array.isArray(model.enable_groups)
        ? model.enable_groups
        : [];
      if (enableGroups.includes(selectedGroup)) {
        candidateModelNames.add(model.model_name);
      }
    });

    return Array.from(candidateModelNames)
      .sort((a, b) => a.localeCompare(b))
      .map((modelName) => {
        const modelInfo = globalModelMap.get(modelName);
        const currentEntry = billingDraft[selectedGroup]?.[modelName] || null;
        const globalSummary = getGlobalSummary(modelInfo);
        const overrideSummary = getOverrideSummary(currentEntry);

        return {
          key: modelName,
          modelName,
          modelInfo,
          currentEntry,
          globalSummary,
          overrideSummary,
          availableInGroup: Array.isArray(modelInfo?.enableGroups)
            ? modelInfo.enableGroups.includes(selectedGroup)
            : false,
        };
      });
  }, [billingDraft, globalModelMap, pricingModels, selectedGroup]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return groupRows.filter((row) => {
      const keywordMatch = keyword
        ? row.modelName.toLowerCase().includes(keyword)
        : true;
      const overrideMatch = overrideOnly ? Boolean(row.currentEntry) : true;
      return keywordMatch && overrideMatch;
    });
  }, [groupRows, overrideOnly, searchText]);

  useEffect(() => {
    if (groupRows.length === 0) {
      setSelectedModelName('');
      return;
    }

    if (!groupRows.some((row) => row.modelName === selectedModelName)) {
      setSelectedModelName(groupRows[0].modelName);
    }
  }, [groupRows, selectedModelName]);

  const selectedRow = useMemo(
    () => groupRows.find((row) => row.modelName === selectedModelName) || null,
    [groupRows, selectedModelName],
  );

  const currentEntry = selectedRow?.currentEntry || DEFAULT_ENTRY;
  const legacyBillingOption = getLegacyBillingOption(currentEntry.billingSource);
  const billingSourceOptions = [
    { value: '', label: 'Follow user preference' },
    { value: 'wallet_only', label: 'Wallet only' },
    { value: 'subscription_only', label: 'Subscription only' },
    ...(legacyBillingOption ? [legacyBillingOption] : []),
  ];

  const hasOverrides = useMemo(
    () =>
      Object.values(billingDraft).some(
        (groupModels) => Object.keys(groupModels || {}).length > 0,
      ),
    [billingDraft],
  );

  const updateCurrentEntry = (partial) => {
    if (!selectedGroup || !selectedModelName) {
      return;
    }

    setBillingDraft((previous) => {
      const next = { ...previous };
      const previousGroup = { ...(next[selectedGroup] || {}) };
      const previousEntry = previousGroup[selectedModelName] || DEFAULT_ENTRY;
      const mergedEntry = {
        ...previousEntry,
        ...partial,
      };

      const normalizedEntry = {
        mode: mergedEntry.mode === 'per-request' ? 'per-request' : 'inherit',
        modelPrice:
          mergedEntry.mode === 'per-request'
            ? mergedEntry.modelPrice ?? ''
            : '',
        billingSource: `${mergedEntry.billingSource || ''}`.trim(),
      };

      if (
        normalizedEntry.mode === 'inherit' &&
        normalizedEntry.billingSource === ''
      ) {
        delete previousGroup[selectedModelName];
      } else {
        previousGroup[selectedModelName] = normalizedEntry;
      }

      if (Object.keys(previousGroup).length === 0) {
        delete next[selectedGroup];
      } else {
        next[selectedGroup] = previousGroup;
      }

      return next;
    });
  };

  const handleDeleteCurrentEntry = () => {
    updateCurrentEntry({
      mode: 'inherit',
      modelPrice: '',
      billingSource: '',
    });
  };

  const handleSave = async () => {
    let serialized;
    try {
      serialized = serializeBillingDraft(billingDraft);
    } catch (error) {
      showError(error.message || 'Save failed');
      return;
    }

    const nextValue = JSON.stringify(serialized, null, 2);
    const currentValue = JSON.stringify(originalPersistedValue, null, 2);

    if (nextValue === currentValue) {
      showWarning('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const res = await API.put('/api/option/', {
        key: 'GroupModelBilling',
        value: nextValue,
      });

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Save failed');
      }

      showSuccess('Saved');
      await refresh();
    } catch (error) {
      console.error('Save GroupModelBilling failed:', error);
      showError(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Model',
        dataIndex: 'modelName',
        key: 'modelName',
        render: (text, record) => (
          <Space>
            <Button
              theme='borderless'
              type='tertiary'
              style={{
                padding: 0,
                color:
                  record.modelName === selectedModelName
                    ? 'var(--semi-color-primary)'
                    : undefined,
              }}
              onClick={() => setSelectedModelName(record.modelName)}
            >
              {text}
            </Button>
            {!record.availableInGroup ? (
              <Tag color='orange' shape='circle'>
                Override only
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: 'Global pricing',
        dataIndex: 'globalSummary',
        key: 'globalSummary',
        render: (summary) => (
          <Space>
            <Tag color={summary.tagColor} shape='circle'>
              {summary.tagText}
            </Tag>
            <Text>{summary.text}</Text>
          </Space>
        ),
      },
      {
        title: 'Current override',
        dataIndex: 'overrideSummary',
        key: 'overrideSummary',
        render: (summary) => (
          <Space>
            <Tag color={summary.tagColor} shape='circle'>
              {summary.tagText}
            </Tag>
            <Text>{summary.text}</Text>
          </Space>
        ),
      },
    ],
    [selectedModelName],
  );

  return (
    <Spin spinning={loading}>
      <Space vertical style={{ width: '100%' }} spacing={16}>
        <Banner
          type='info'
          bordered
          closeIcon={null}
          title='Notes'
          description={
            <div className='space-y-1 text-sm'>
              <div>
                This editor currently supports two kinds of overrides: per-request
                pricing, and billing source limits.
              </div>
              <div>
                When pricing mode is set to follow global pricing, the model keeps
                using the global price config. If a billing source is set, only the
                wallet/subscription preference is overridden.
              </div>
              <div>
                Recommended billing source values in this editor are: follow user
                preference, wallet only, subscription only.
              </div>
            </div>
          }
        />

        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Select
              style={{ width: 260 }}
              value={selectedGroup}
              optionList={groupOptions}
              onChange={(value) => setSelectedGroup(value)}
              placeholder='Select group'
            />
            <Input
              prefix={<IconSearch />}
              placeholder='Search model'
              value={searchText}
              onChange={(value) => setSearchText(value)}
              style={{ width: isMobile ? '100%' : 220 }}
              showClear
            />
            <Checkbox
              checked={overrideOnly}
              onChange={(event) => setOverrideOnly(event.target.checked)}
            >
              Overrides only
            </Checkbox>
          </Space>

          <Space wrap>
            <Tag color={hasOverrides ? 'blue' : 'grey'} shape='circle'>
              Draft groups {Object.keys(billingDraft).length}
            </Tag>
            <Button
              type='primary'
              icon={<IconSave />}
              loading={saving}
              onClick={handleSave}
            >
              Save overrides
            </Button>
          </Space>
        </Space>

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isMobile
              ? 'minmax(0, 1fr)'
              : 'minmax(460px, 1.2fr) minmax(360px, 1fr)',
          }}
        >
          <Card
            title='Model list'
            bodyStyle={{ padding: 0 }}
            style={isMobile ? { order: 2 } : undefined}
          >
            <Table
              rowKey='modelName'
              columns={columns}
              dataSource={filteredRows}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
              empty={
                <Empty
                  title='No models'
                  description='No models are available for the current group or filters.'
                />
              }
              onRow={(record) => ({
                onClick: () => setSelectedModelName(record.modelName),
                style: {
                  background:
                    record.modelName === selectedModelName
                      ? 'var(--semi-color-primary-light-default)'
                      : undefined,
                  boxShadow:
                    record.modelName === selectedModelName
                      ? 'inset 4px 0 0 var(--semi-color-primary)'
                      : undefined,
                  transition: 'background 0.2s ease, box-shadow 0.2s ease',
                },
              })}
              scroll={isMobile ? { x: 760 } : undefined}
            />
          </Card>

          <Card
            title={selectedRow ? selectedRow.modelName : 'Group model billing editor'}
            style={isMobile ? { order: 1 } : undefined}
            headerExtraContent={
              selectedRow ? (
                <Space>
                  {selectedRow.availableInGroup ? (
                    <Tag color='green' shape='circle'>
                      Available in group
                    </Tag>
                  ) : (
                    <Tag color='orange' shape='circle'>
                      Stored override only
                    </Tag>
                  )}
                </Space>
              ) : null
            }
          >
            {!selectedRow ? (
              <Empty
                title='No model selected'
                description='Select a model on the left first.'
              />
            ) : (
              <Space vertical style={{ width: '100%' }} spacing={16}>
                <Card
                  bodyStyle={{ padding: 12 }}
                  style={{ background: 'var(--semi-color-fill-0)' }}
                >
                  <Space vertical spacing={8} style={{ width: '100%' }}>
                    <div>
                      <Text strong>Global pricing</Text>
                      <div className='mt-1 text-sm text-gray-600'>
                        {selectedRow.globalSummary.text}
                      </div>
                    </div>
                    <div>
                      <Text strong>Current override</Text>
                      <div className='mt-1 text-sm text-gray-600'>
                        {selectedRow.overrideSummary.text}
                      </div>
                    </div>
                  </Space>
                </Card>

                <div>
                  <div className='mb-2 font-medium text-gray-700'>
                    Pricing mode
                  </div>
                  <RadioGroup
                    type='button'
                    value={currentEntry.mode}
                    onChange={(event) =>
                      updateCurrentEntry({ mode: event.target.value })
                    }
                  >
                    <Radio value='inherit'>Follow global</Radio>
                    <Radio value='per-request'>Per-request override</Radio>
                  </RadioGroup>
                  <div className='mt-2 text-xs text-gray-500'>
                    This reflects current backend behavior accurately: per-request
                    override is reliable, while follow-global keeps the global
                    pricing mode and only preserves billing source limits.
                  </div>
                </div>

                {currentEntry.mode === 'per-request' ? (
                  <div>
                    <div className='mb-2 font-medium text-gray-700'>
                      Per-request price
                    </div>
                    <Input
                      value={currentEntry.modelPrice}
                      placeholder='Enter price per call'
                      suffix='$/call'
                      onChange={(value) => {
                        if (!NUMERIC_INPUT_REGEX.test(value)) {
                          return;
                        }
                        updateCurrentEntry({ modelPrice: value });
                      }}
                    />
                  </div>
                ) : null}

                <div>
                  <div className='mb-2 font-medium text-gray-700'>
                    Billing source
                  </div>
                  <Select
                    value={currentEntry.billingSource}
                    optionList={billingSourceOptions}
                    onChange={(value) =>
                      updateCurrentEntry({ billingSource: value })
                    }
                  />
                  <div className='mt-2 text-xs text-gray-500'>
                    Follow user preference means this model keeps using the
                    billing preference saved on the wallet page. Wallet only and
                    subscription only override that preference.
                  </div>
                </div>

                {legacyBillingOption ? (
                  <Banner
                    type='warning'
                    bordered
                    closeIcon={null}
                    title='Legacy billing source detected'
                    description={`This entry uses an older billing_source value: ${legacyBillingOption.value}. It can still be saved unchanged, but new edits should prefer the three recommended values.`}
                  />
                ) : null}

                <Card
                  bodyStyle={{ padding: 12 }}
                  style={{ background: 'var(--semi-color-fill-0)' }}
                >
                  <div className='mb-2 font-medium text-gray-700'>
                    Persisted payload preview
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                    }}
                  >
                    {JSON.stringify(
                      (() => {
                        const previewDraft = {
                          [selectedGroup]: {
                            [selectedModelName]: currentEntry,
                          },
                        };
                        try {
                          return serializeBillingDraft(previewDraft)[selectedGroup]
                            ?.[selectedModelName] || {};
                        } catch (error) {
                          return {
                            error: error.message,
                          };
                        }
                      })(),
                      null,
                      2,
                    )}
                  </pre>
                </Card>

                <Space>
                  <Button
                    icon={<IconDelete />}
                    type='danger'
                    onClick={handleDeleteCurrentEntry}
                    disabled={!selectedRow.currentEntry}
                  >
                    Remove current override
                  </Button>
                </Space>
              </Space>
            )}
          </Card>
        </div>
      </Space>
    </Spin>
  );
}
