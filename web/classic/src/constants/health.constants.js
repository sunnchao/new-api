export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
};

export const HEALTH_STATUS_MAP = {
  [HEALTH_STATUS.HEALTHY]: {
    color: '#10b981',
    icon: 'green',
    label: 'health.status.online',
  },
  [HEALTH_STATUS.DEGRADED]: {
    color: '#f59e0b',
    icon: 'yellow',
    label: 'health.status.degraded',
  },
  [HEALTH_STATUS.OFFLINE]: {
    color: '#ef4444',
    icon: 'red',
    label: 'health.status.offline',
  },
  [HEALTH_STATUS.UNKNOWN]: {
    color: '#9ca3af',
    icon: 'gray',
    label: 'health.status.unknown',
  },
};

export function deriveModelHealth(channels) {
  if (!channels || channels.length === 0) return HEALTH_STATUS.UNKNOWN;
  const enabledChannels = channels.filter((c) => c.status === 1);
  if (enabledChannels.length === 0) return HEALTH_STATUS.OFFLINE;
  if (enabledChannels.length < channels.length) return HEALTH_STATUS.DEGRADED;
  return HEALTH_STATUS.HEALTHY;
}

export function deriveAvgLatency(channels) {
  if (!channels || channels.length === 0) return null;
  const testedChannels = channels.filter((c) => c.response_time > 0);
  if (testedChannels.length === 0) return null;
  const sum = testedChannels.reduce((acc, c) => acc + c.response_time, 0);
  return Math.round(sum / testedChannels.length);
}

export function deriveHealthFromSuccessRate(rate) {
  if (!Number.isFinite(rate)) return HEALTH_STATUS.UNKNOWN;
  if (rate >= 99.9) return HEALTH_STATUS.HEALTHY;
  if (rate >= 99) return HEALTH_STATUS.DEGRADED;
  return HEALTH_STATUS.OFFLINE;
}

export function formatLatency(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
