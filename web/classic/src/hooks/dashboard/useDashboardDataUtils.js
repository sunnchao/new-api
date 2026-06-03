const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getQuotaItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeQuotaItem = (item, fallbackTimestamp) => {
  const record = item && typeof item === 'object' ? item : {};

  return {
    ...record,
    count: toFiniteNumber(record.count),
    model_name: record.model_name || '无数据',
    quota: toFiniteNumber(record.quota),
    token_used: toFiniteNumber(record.token_used),
    created_at: toFiniteNumber(record.created_at, fallbackTimestamp),
  };
};

export const normalizeQuotaDataListPayload = (
  payload,
  fallbackTimestamp = Date.now() / 1000,
) =>
  getQuotaItems(payload)
    .map((item) => normalizeQuotaItem(item, fallbackTimestamp))
    .sort((a, b) => a.created_at - b.created_at);

export const normalizeDashboardQuotaDataPayload = (
  payload,
  fallbackTimestamp = Date.now() / 1000,
) => {
  const items = normalizeQuotaDataListPayload(payload, fallbackTimestamp);

  if (items.length > 0) {
    return items;
  }

  return [
    {
      count: 0,
      model_name: '无数据',
      quota: 0,
      token_used: 0,
      created_at: fallbackTimestamp,
    },
  ];
};
