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

// Reserved pseudo-model key used to persist group-level default quota_type /
// model_price / billing_source.
const GROUP_DEFAULT_MODEL_KEY = '__default__';

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

const formatPrice = (value, t) => {
  const num = toNumberOrNull(value);
  if (num === null) {
    return t('未设置');
  }
  return `$${parseFloat(num.toFixed(6))}/${t('次')}`;
};

const getBillingSourceTag = (billingSource, t) => {
  switch (billingSource) {
    case 'wallet_only':
      return {
        color: 'orange',
        text: t('仅余额'),
      };
    case 'subscription_only':
      return {
        color: 'indigo',
        text: t('仅订阅'),
      };
    default:
      return {
        color: 'grey',
        text: t('跟随用户偏好'),
      };
  }
};

const getLegacyBillingOption = (billingSource, t) => {
  if (
    !billingSource ||
    ['wallet_only', 'subscription_only'].includes(billingSource)
  ) {
    return null;
  }
  return {
    value: billingSource,
    label: t('历史值：{{value}}', { value: billingSource }),
  };
};

const getBillingSourceOptions = (billingSource, t) => {
  const legacyBillingOption = getLegacyBillingOption(billingSource, t);
  return [
    { value: '', label: t('跟随用户偏好') },
    { value: 'wallet_only', label: t('仅余额') },
    { value: 'subscription_only', label: t('仅订阅') },
    ...(legacyBillingOption ? [legacyBillingOption] : []),
  ];
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

      if (modelName === GROUP_DEFAULT_MODEL_KEY) {
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
        return;
      }

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
      if (modelName === GROUP_DEFAULT_MODEL_KEY) {
        return;
      }
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

const getGlobalSummary = (modelInfo, t) => {
  if (!modelInfo) {
    return {
      text: t('未找到全局计费配置'),
      tagColor: 'grey',
      tagText: t('未知'),
    };
  }

  if (modelInfo.quotaType === 1) {
    return {
      text: t('全局按次计费：{{price}}', {
        price: formatPrice(modelInfo.modelPrice, t),
      }),
      tagColor: 'teal',
      tagText: t('按次计费'),
    };
  }

  if (modelInfo.quotaType === 0) {
    const ratioText = hasValue(modelInfo.modelRatio)
      ? t('倍率 {{ratio}}', { ratio: modelInfo.modelRatio })
      : t('按量计费');
    return {
      text: t('全局按量计费｜{{ratio}}', { ratio: ratioText }),
      tagColor: 'violet',
      tagText: t('按量计费'),
    };
  }

  return {
    text: t('未找到全局计费配置'),
    tagColor: 'grey',
    tagText: t('未知'),
  };
};

const getOverrideSummary = (entry, groupDefaultEntry, t) => {
  const effectiveMode =
    entry?.mode === 'per-request'
      ? 'per-request'
      : groupDefaultEntry?.mode === 'per-request'
        ? 'per-request'
        : 'inherit';
  const effectiveModelPrice =
    entry?.mode === 'per-request'
      ? entry?.modelPrice
      : groupDefaultEntry?.mode === 'per-request'
        ? groupDefaultEntry?.modelPrice
        : '';
  const effectiveBillingSource =
    entry?.billingSource || groupDefaultEntry?.billingSource || '';
  const sourceTag = getBillingSourceTag(effectiveBillingSource, t);
  const sourceLabel = entry?.billingSource
    ? sourceTag.text
    : groupDefaultEntry?.billingSource
      ? t('分组默认：{{value}}', { value: sourceTag.text })
      : t('跟随用户偏好');

  if (
    !entry &&
    groupDefaultEntry?.mode !== 'per-request' &&
    !groupDefaultEntry?.billingSource
  ) {
    return {
      text: t('跟随全局计费与用户偏好'),
      tagColor: 'grey',
      tagText: t('无覆盖'),
    };
  }
  if (entry?.mode === 'per-request') {
    return {
      text: t('模型按次覆盖：{{price}}｜{{source}}', {
        price: formatPrice(entry.modelPrice, t),
        source: sourceLabel,
      }),
      tagColor: 'teal',
      tagText: t('模型覆盖'),
    };
  }

  if (effectiveMode === 'per-request') {
    return {
      text: t('继承分组默认按次计费：{{price}}｜{{source}}', {
        price: formatPrice(effectiveModelPrice, t),
        source: sourceLabel,
      }),
      tagColor: 'cyan',
      tagText: t('分组默认'),
    };
  }

  return {
    text: t('跟随全局计费｜{{source}}', { source: sourceLabel }),
    tagColor: groupDefaultEntry?.billingSource ? 'cyan' : 'blue',
    tagText: groupDefaultEntry?.billingSource ? t('分组默认') : t('仅来源覆盖'),
  };
};

const serializeBillingDraft = (billingDraft) => {
  const result = {};

  for (const [groupName, groupModels] of Object.entries(billingDraft)) {
    for (const [modelName, entry] of Object.entries(groupModels || {})) {
      const mode = entry?.mode === 'per-request' ? 'per-request' : 'inherit';
      const billingSource = `${entry?.billingSource || ''}`.trim();

      if (modelName === GROUP_DEFAULT_MODEL_KEY) {
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
              `分组 ${groupName} 的默认配置缺少有效的按次价格`,
            );
          }
          result[groupName][modelName] = {
            quota_type: 1,
            model_price: modelPrice,
          };
        } else {
          result[groupName][modelName] = {};
        }
        if (billingSource) {
          result[groupName][modelName].billing_source = billingSource;
        }
        continue;
      }

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
            `分组 ${groupName} 下模型 ${modelName} 缺少有效的按次价格`,
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
          showError(res.data?.message || t('获取模型列表失败'));
        }
      } catch (error) {
        if (mounted) {
          showError(t('获取模型列表失败'));
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
  }, [t]);

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
      Object.keys(billingDraft[selectedGroup] || {}).filter(
        (modelName) => modelName !== GROUP_DEFAULT_MODEL_KEY,
      ),
    );

    const groupDefaultEntry =
      billingDraft[selectedGroup]?.[GROUP_DEFAULT_MODEL_KEY] || null;

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
        const globalSummary = getGlobalSummary(modelInfo, t);
        const overrideSummary = getOverrideSummary(
          currentEntry,
          groupDefaultEntry,
          t,
        );

        return {
          key: modelName,
          modelName,
          modelInfo,
          currentEntry,
          groupDefaultEntry,
          globalSummary,
          overrideSummary,
          hasEffectiveOverride:
            Boolean(currentEntry) ||
            groupDefaultEntry?.mode === 'per-request' ||
            Boolean(groupDefaultEntry?.billingSource),
          availableInGroup: Array.isArray(modelInfo?.enableGroups)
            ? modelInfo.enableGroups.includes(selectedGroup)
            : false,
        };
      });
  }, [billingDraft, globalModelMap, pricingModels, selectedGroup, t]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return groupRows.filter((row) => {
      const keywordMatch = keyword
        ? row.modelName.toLowerCase().includes(keyword)
        : true;
      const overrideMatch = overrideOnly ? Boolean(row.hasEffectiveOverride) : true;
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
  const selectedGroupDefaultEntry =
    billingDraft[selectedGroup]?.[GROUP_DEFAULT_MODEL_KEY] || DEFAULT_ENTRY;
  const legacyBillingOption = getLegacyBillingOption(currentEntry.billingSource, t);
  const groupDefaultLegacyBillingOption = getLegacyBillingOption(
    selectedGroupDefaultEntry.billingSource,
    t,
  );
  const billingSourceOptions = getBillingSourceOptions(
    currentEntry.billingSource,
    t,
  );
  const groupDefaultBillingSourceOptions = getBillingSourceOptions(
    selectedGroupDefaultEntry.billingSource,
    t,
  );

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

  const updateGroupDefaultEntry = (partial) => {
    if (!selectedGroup) {
      return;
    }

    setBillingDraft((previous) => {
      const next = { ...previous };
      const previousGroup = { ...(next[selectedGroup] || {}) };
      const previousEntry =
        previousGroup[GROUP_DEFAULT_MODEL_KEY] || DEFAULT_ENTRY;
      const mergedEntry = {
        ...previousEntry,
        ...partial,
      };
      const normalizedEntry = {
        mode: mergedEntry.mode === 'per-request' ? 'per-request' : 'inherit',
        modelPrice:
          mergedEntry.mode === 'per-request' ? mergedEntry.modelPrice ?? '' : '',
        billingSource: `${mergedEntry.billingSource || ''}`.trim(),
      };

      if (
        normalizedEntry.mode === 'inherit' &&
        normalizedEntry.billingSource === ''
      ) {
        delete previousGroup[GROUP_DEFAULT_MODEL_KEY];
      } else {
        previousGroup[GROUP_DEFAULT_MODEL_KEY] = normalizedEntry;
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

  const handleDeleteGroupDefaultEntry = () => {
    updateGroupDefaultEntry({
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
      showError(error?.message ? t(error.message) : t('保存失败'));
      return;
    }

    const nextValue = JSON.stringify(serialized, null, 2);
    const currentValue = JSON.stringify(originalPersistedValue, null, 2);

    if (nextValue === currentValue) {
      showWarning(t('你似乎并没有修改什么'));
      return;
    }

    setSaving(true);
    try {
      const res = await API.put('/api/option/', {
        key: 'GroupModelBilling',
        value: nextValue,
      });

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || t('保存失败'));
      }

      showSuccess(t('保存成功'));
      await refresh();
    } catch (error) {
      console.error('Save GroupModelBilling failed:', error);
      showError(error?.message ? t(error.message) : t('保存失败'));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: t('模型'),
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
                {t('仅保留覆盖')}
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('全局计费'),
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
        title: t('当前覆盖'),
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
    [selectedModelName, t],
  );

  return (
    <Spin spinning={loading}>
      <Space vertical style={{ width: '100%' }} spacing={16}>
        <Banner
          type='info'
          bordered
          closeIcon={null}
          title={t('使用说明')}
          description={
            <div className='space-y-1 text-sm'>
              <div>
                {t(
                  '此编辑器用于配置“分组 + 模型”级别的计费覆盖，支持按次价格覆盖与计费来源限制。',
                )}
              </div>
              <div>
                {t(
                  '模型级配置优先级最高；若模型自身未填写价格模式或计费来源，则回退到当前分组的 __default__；若分组默认也未设置，则继续跟随全局价格配置与用户钱包偏好。',
                )}
              </div>
              <div>
                {t(
                  '推荐使用的计费来源值为：跟随用户偏好、仅余额、仅订阅。历史值仍可保留，但不建议继续新增。',
                )}
              </div>
              <div>
                {t(
                  '你也可以通过保留键 __default__ 设置分组默认的价格模式、按次价格和计费来源；当模型未显式设置这些字段时，会自动继承分组默认值。',
                )}
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
              placeholder={t('选择分组')}
            />
            <Input
              prefix={<IconSearch />}
              placeholder={t('搜索模型名称')}
              value={searchText}
              onChange={(value) => setSearchText(value)}
              style={{ width: isMobile ? '100%' : 220 }}
              showClear
            />
            <Checkbox
              checked={overrideOnly}
              onChange={(event) => setOverrideOnly(event.target.checked)}
            >
              {t('仅显示覆盖项')}
            </Checkbox>
          </Space>

          <Space wrap>
            <Tag color={hasOverrides ? 'blue' : 'grey'} shape='circle'>
              {t('草稿分组 {{count}} 个', {
                count: Object.keys(billingDraft).length,
              })}
            </Tag>
            <Button
              type='primary'
              icon={<IconSave />}
              loading={saving}
              onClick={handleSave}
            >
              {t('保存覆盖规则')}
            </Button>
          </Space>
        </Space>

        {selectedGroup ? (
          <Card title={t('分组默认覆盖')}> 
            <Space vertical style={{ width: '100%' }} spacing={16}>
              <div>
                <div className='mb-2 font-medium text-gray-700'>
                  {t('分组 {{group}} 的默认价格模式', { group: selectedGroup })}
                </div>
                <RadioGroup
                  type='button'
                  value={selectedGroupDefaultEntry.mode}
                  onChange={(event) =>
                    updateGroupDefaultEntry({ mode: event.target.value })
                  }
                >
                  <Radio value='inherit'>{t('不设置分组默认价格')}</Radio>
                  <Radio value='per-request'>{t('分组默认按次计费')}</Radio>
                </RadioGroup>
                <div className='mt-2 text-xs text-gray-500'>
                  {t(
                    '启用后，当前分组下未单独配置价格模式的模型，将默认继承该分组的按次价格。',
                  )}
                </div>
              </div>

              {selectedGroupDefaultEntry.mode === 'per-request' ? (
                <div>
                  <div className='mb-2 font-medium text-gray-700'>
                    {t('分组默认按次价格')}
                  </div>
                  <Input
                    value={selectedGroupDefaultEntry.modelPrice}
                    placeholder={t('输入每次调用价格')}
                    suffix={t('$/次')}
                    onChange={(value) => {
                      if (!NUMERIC_INPUT_REGEX.test(value)) {
                        return;
                      }
                      updateGroupDefaultEntry({ modelPrice: value });
                    }}
                  />
                </div>
              ) : null}

              <div>
                <div className='mb-2 font-medium text-gray-700'>
                  {t('分组 {{group}} 的默认计费来源', { group: selectedGroup })}
                </div>
                <Select
                  value={selectedGroupDefaultEntry.billingSource}
                  optionList={groupDefaultBillingSourceOptions}
                  onChange={(value) =>
                    updateGroupDefaultEntry({ billingSource: value })
                  }
                />
                <div className='mt-2 text-xs text-gray-500'>
                  {t(
                    '仅当当前“分组 + 模型”未显式设置 billing_source 时，才会回退到这里；模型级 billing_source 的优先级更高。',
                  )}
                </div>
              </div>

              {groupDefaultLegacyBillingOption ? (
                <Banner
                  type='warning'
                  bordered
                  closeIcon={null}
                  title={t('检测到历史分组默认计费来源值')}
                  description={t(
                    '当前分组默认计费来源使用了历史值：{{value}}。系统仍可保留保存，但后续新增或调整时建议改为推荐值。',
                    { value: groupDefaultLegacyBillingOption.value },
                  )}
                />
              ) : null}

              <Card
                bodyStyle={{ padding: 12 }}
                style={{ background: 'var(--semi-color-fill-0)' }}
              >
                <div className='mb-2 font-medium text-gray-700'>
                  {t('分组默认配置预览')}
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
                          [GROUP_DEFAULT_MODEL_KEY]: selectedGroupDefaultEntry,
                        },
                      };
                      try {
                        return serializeBillingDraft(previewDraft)[selectedGroup]?.[
                          GROUP_DEFAULT_MODEL_KEY
                        ] || {};
                      } catch (error) {
                        return {
                          错误: error.message,
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
                  onClick={handleDeleteGroupDefaultEntry}
                  disabled={!billingDraft[selectedGroup]?.[GROUP_DEFAULT_MODEL_KEY]}
                >
                  {t('移除分组默认配置')}
                </Button>
              </Space>
            </Space>
          </Card>
        ) : null}

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
            title={t('模型列表')}
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
                  title={t('暂无模型')}
                  description={t('当前分组或筛选条件下没有可展示的模型')}
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
            title={selectedRow ? selectedRow.modelName : t('分组模型计费覆盖编辑器')}
            style={isMobile ? { order: 1 } : undefined}
            headerExtraContent={
              selectedRow ? (
                <Space>
                  {selectedRow.availableInGroup ? (
                    <Tag color='green' shape='circle'>
                      {t('当前分组可用')}
                    </Tag>
                  ) : (
                    <Tag color='orange' shape='circle'>
                      {t('仅保留覆盖记录')}
                    </Tag>
                  )}
                </Space>
              ) : null
            }
          >
            {!selectedRow ? (
              <Empty
                title={t('尚未选择模型')}
                description={t('请先从左侧列表选择一个模型')}
              />
            ) : (
              <Space vertical style={{ width: '100%' }} spacing={16}>
                <Card
                  bodyStyle={{ padding: 12 }}
                  style={{ background: 'var(--semi-color-fill-0)' }}
                >
                  <Space vertical spacing={8} style={{ width: '100%' }}>
                    <div>
                      <Text strong>{t('全局计费')}</Text>
                      <div className='mt-1 text-sm text-gray-600'>
                        {selectedRow.globalSummary.text}
                      </div>
                    </div>
                    <div>
                      <Text strong>{t('当前覆盖')}</Text>
                      <div className='mt-1 text-sm text-gray-600'>
                        {selectedRow.overrideSummary.text}
                      </div>
                    </div>
                  </Space>
                </Card>

                <div>
                  <div className='mb-2 font-medium text-gray-700'>
                    {t('价格模式')}
                  </div>
                  <RadioGroup
                    type='button'
                    value={currentEntry.mode}
                    onChange={(event) =>
                      updateCurrentEntry({ mode: event.target.value })
                    }
                  >
                    <Radio value='inherit'>{t('继承分组默认 / 全局配置')}</Radio>
                    <Radio value='per-request'>{t('模型按次覆盖')}</Radio>
                  </RadioGroup>
                  <div className='mt-2 text-xs text-gray-500'>
                    {t(
                      '选择“继承”后，会优先尝试当前分组的 __default__ 配置；若分组未设置默认价格，再回退到全局模型计费配置。',
                    )}
                  </div>
                </div>

                {currentEntry.mode === 'per-request' ? (
                  <div>
                    <div className='mb-2 font-medium text-gray-700'>
                      {t('按次价格')}
                    </div>
                    <Input
                      value={currentEntry.modelPrice}
                      placeholder={t('输入每次调用价格')}
                      suffix={t('$/次')}
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
                    {t('计费来源')}
                  </div>
                  <Select
                    value={currentEntry.billingSource}
                    optionList={billingSourceOptions}
                    onChange={(value) =>
                      updateCurrentEntry({ billingSource: value })
                    }
                  />
                  <div className='mt-2 text-xs text-gray-500'>
                    {t(
                      '“跟随用户偏好”表示继续使用钱包页保存的计费偏好；“仅余额”和“仅订阅”会直接覆盖该偏好。',
                    )}
                  </div>
                </div>

                {legacyBillingOption ? (
                  <Banner
                    type='warning'
                    bordered
                    closeIcon={null}
                    title={t('检测到历史计费来源值')}
                    description={t(
                      '当前条目使用了历史 billing_source 值：{{value}}。系统仍可原样保存，但建议后续改为推荐值。',
                      { value: legacyBillingOption.value },
                    )}
                  />
                ) : null}

                <Card
                  bodyStyle={{ padding: 12 }}
                  style={{ background: 'var(--semi-color-fill-0)' }}
                >
                  <div className='mb-2 font-medium text-gray-700'>
                    {t('持久化配置预览')}
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
                            错误: error.message,
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
                    {t('移除当前覆盖')}
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
