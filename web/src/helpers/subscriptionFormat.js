export function formatSubscriptionDuration(plan, t) {
  const unit = plan?.duration_unit || 'month';
  const value = plan?.duration_value || 1;
  const unitLabels = {
    year: t('年'),
    month: t('个月'),
    day: t('天'),
    hour: t('小时'),
    custom: t('自定义'),
  };
  if (unit === 'custom') {
    const seconds = plan?.custom_seconds || 0;
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} ${t('天')}`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} ${t('小时')}`;
    return `${seconds} ${t('秒')}`;
  }
  return `${value} ${unitLabels[unit] || unit}`;
}

export function normalizeSubscriptionResetMode(mode) {
  return mode === 'natural' ? 'natural' : 'anchor';
}

export function formatSubscriptionResetMode(mode, t, options = {}) {
  const normalized = normalizeSubscriptionResetMode(mode);
  if (options.short) {
    return normalized === 'natural' ? t('自然') : t('锚点');
  }
  return normalized === 'natural' ? t('自然周期') : t('订阅锚点周期');
}

export function formatSubscriptionResetPeriod(plan, t, options = {}) {
  const period = plan?.quota_reset_period || 'never';
  let label = t('不重置');
  if (period === 'daily') label = t('每天');
  if (period === 'weekly') label = t('每周');
  if (period === 'monthly') label = t('每月');
  if (period === 'custom') {
    const seconds = Number(plan?.quota_reset_custom_seconds || 0);
    if (seconds >= 86400) label = `${Math.floor(seconds / 86400)} ${t('天')}`;
    else if (seconds >= 3600) label = `${Math.floor(seconds / 3600)} ${t('小时')}`;
    else if (seconds >= 60) label = `${Math.floor(seconds / 60)} ${t('分钟')}`;
    else label = `${seconds} ${t('秒')}`;
  }

  const includeMode = options.includeMode !== false;
  if (
    includeMode &&
    ['daily', 'weekly', 'monthly'].includes(period)
  ) {
    return `${label} · ${formatSubscriptionResetMode(plan?.quota_reset_mode, t, {
      short: options.shortMode,
    })}`;
  }
  return label;
}

export function getSubscriptionQuotaLimitItems(source, t) {
  if (!source) return [];

  const hourlyAmount = Number(source?.hourly_limit_amount || 0);
  const hourlyHours = Number(source?.hourly_limit_hours || 1);
  const dailyAmount = Number(source?.daily_limit_amount || 0);
  const weeklyAmount = Number(source?.weekly_limit_amount || 0);
  const monthlyAmount = Number(source?.monthly_limit_amount || 0);

  return [
    hourlyAmount > 0
      ? {
          key: 'hourly',
          label: `${t('每')}${hourlyHours}${t('小时')}`,
          amount: hourlyAmount,
          mode: source?.hourly_reset_mode,
          used: Number(source?.hourly_amount_used || 0),
          nextResetTime: Number(source?.hourly_next_reset_time || 0),
        }
      : null,
    dailyAmount > 0
      ? {
          key: 'daily',
          label: t('每天'),
          amount: dailyAmount,
          mode: source?.daily_reset_mode,
          used: Number(source?.daily_amount_used || 0),
          nextResetTime: Number(source?.daily_next_reset_time || 0),
        }
      : null,
    weeklyAmount > 0
      ? {
          key: 'weekly',
          label: t('每周'),
          amount: weeklyAmount,
          mode: source?.weekly_reset_mode,
          used: Number(source?.weekly_amount_used || 0),
          nextResetTime: Number(source?.weekly_next_reset_time || 0),
        }
      : null,
    monthlyAmount > 0
      ? {
          key: 'monthly',
          label: t('每月'),
          amount: monthlyAmount,
          mode: source?.monthly_reset_mode,
          used: Number(source?.monthly_amount_used || 0),
          nextResetTime: Number(source?.monthly_next_reset_time || 0),
        }
      : null,
  ].filter(Boolean);
}

export function formatSubscriptionQuotaLimitSummary(source, t, options = {}) {
  const items = getSubscriptionQuotaLimitItems(source, t);
  if (items.length === 0) {
    return t('无');
  }

  const maxItems = Number(options.maxItems || items.length);
  const includeMode = options.includeMode !== false;
  const segments = items.slice(0, maxItems).map((item) => {
    const modeSuffix = includeMode
      ? ` · ${formatSubscriptionResetMode(item.mode, t, { short: true })}`
      : '';
    return `${item.label} ${item.amount}${modeSuffix}`;
  });

  if (items.length > maxItems) {
    segments.push(t('另 {{count}} 项', { count: items.length - maxItems }));
  }

  return segments.join(' / ');
}
