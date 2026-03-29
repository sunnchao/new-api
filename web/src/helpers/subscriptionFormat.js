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
