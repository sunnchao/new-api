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
    else if (seconds >= 3600)
      label = `${Math.floor(seconds / 3600)} ${t('小时')}`;
    else if (seconds >= 60) label = `${Math.floor(seconds / 60)} ${t('分钟')}`;
    else label = `${seconds} ${t('秒')}`;
  }

  const includeMode = options.includeMode !== false;
  if (includeMode && ['daily', 'weekly', 'monthly'].includes(period)) {
    return `${label} · ${formatSubscriptionResetMode(
      plan?.quota_reset_mode,
      t,
      {
        short: options.shortMode,
      },
    )}`;
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
  const billingMode =
    source?.billing_mode || source?.subscription?.billing_mode || 'quota';

  return [
    hourlyAmount > 0
      ? {
          key: 'hourly',
          label: `${t('每')}${hourlyHours}${t('小时')}`,
          amount: hourlyAmount,
          mode: source?.hourly_reset_mode,
          used: Number(source?.hourly_amount_used || 0),
          nextResetTime: Number(source?.hourly_next_reset_time || 0),
          billing_mode: billingMode,
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
          billing_mode: billingMode,
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
          billing_mode: billingMode,
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
          billing_mode: billingMode,
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
    return `${item.label} ${formatSubscriptionAmountValue(item.amount, item, t)}${modeSuffix}`;
  });

  if (items.length > maxItems) {
    segments.push(t('另 {{count}} 项', { count: items.length - maxItems }));
  }

  return segments.join(' / ');
}

export function normalizeSubscriptionBillingMode(mode) {
  return mode === 'request' ? 'request' : 'quota';
}

function shouldCompatLegacyRequestQuotaValue(value, quotaToDisplayAmount) {
  const raw = Number(value || 0);
  if (!Number.isFinite(raw) || raw < 10000000) {
    return false;
  }
  if (typeof quotaToDisplayAmount !== 'function') {
    return false;
  }

  const converted = Number(quotaToDisplayAmount(raw));
  if (!Number.isFinite(converted) || converted <= 0) {
    return false;
  }

  const rounded = Math.round(converted);
  if (Math.abs(converted - rounded) > 1e-9) {
    return false;
  }
  if (rounded === raw) {
    return false;
  }

  return raw / Math.max(rounded, 1) >= 1000;
}

export function isRequestBasedSubscription(target) {
  const billingMode =
    target?.billing_mode || target?.subscription?.billing_mode || 'quota';
  return normalizeSubscriptionBillingMode(billingMode) === 'request';
}

export function convertSubscriptionAmountToFormValue(
  value,
  billingMode,
  quotaToDisplayAmount,
  options = {},
) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  if (normalizeSubscriptionBillingMode(billingMode) === 'request') {
    if (
      options.legacyRequestQuotaCompat &&
      shouldCompatLegacyRequestQuotaValue(amount, quotaToDisplayAmount)
    ) {
      return Math.round(Number(quotaToDisplayAmount(amount)) || 0);
    }
    return amount;
  }

  return Number(quotaToDisplayAmount(amount).toFixed(2));
}

export function convertSubscriptionAmountToStorageValue(
  value,
  billingMode,
  displayAmountToQuota,
) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  if (normalizeSubscriptionBillingMode(billingMode) === 'request') {
    return Math.round(amount);
  }

  return displayAmountToQuota(amount);
}

export function getSubscriptionTotalLabel(target, t) {
  return isRequestBasedSubscription(target) ? t('总次数') : t('总额度');
}

export function getSubscriptionUnitLabel(target, t) {
  return isRequestBasedSubscription(target) ? t('次') : t('额度');
}

export function getSubscriptionQuotaLimitTitle(target, t) {
  return isRequestBasedSubscription(target) ? t('次数限制') : t('额度限制');
}

export function formatSubscriptionAmountValue(value, target, t, renderQuota) {
  const total = Number(value || 0);
  if (isRequestBasedSubscription(target)) {
    return `${total} ${t('次')}`;
  }
  if (typeof renderQuota === 'function') {
    return renderQuota(total);
  }
  return `${total}`;
}

export function formatSubscriptionTotalValue(value, target, t, renderQuota) {
  return formatSubscriptionAmountValue(value, target, t, renderQuota);
}

export function formatSubscriptionLimitValue(value, target, t, renderQuota) {
  return formatSubscriptionAmountValue(value, target, t, renderQuota);
}

export function formatSubscriptionUsageSummary(
  { used = 0, total = 0 } = {},
  target,
  t,
  renderQuota,
) {
  const usedValue = Number(used || 0);
  const totalValue = Number(total || 0);
  const remainValue = totalValue > 0 ? Math.max(0, totalValue - usedValue) : 0;

  return {
    usedText: formatSubscriptionAmountValue(usedValue, target, t, renderQuota),
    totalText: formatSubscriptionAmountValue(
      totalValue,
      target,
      t,
      renderQuota,
    ),
    remainText: formatSubscriptionAmountValue(
      remainValue,
      target,
      t,
      renderQuota,
    ),
  };
}
