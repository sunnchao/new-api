export function formatThroughput(tps) {
  if (!Number.isFinite(tps) || tps <= 0) return '—';
  if (tps >= 1_000) return `${(tps / 1_000).toFixed(1)}K t/s`;
  return `${tps.toFixed(tps < 10 ? 2 : 1)} t/s`;
}

export function formatLatencyMs(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

export function formatSuccessRate(pct) {
  if (!Number.isFinite(pct)) return '—';
  return `${pct.toFixed(2)}%`;
}

export function getHealthColor(rate) {
  if (!Number.isFinite(rate)) return '#9ca3af';
  if (rate >= 99.9) return '#10b981';
  if (rate >= 99) return '#f59e0b';
  return '#ef4444';
}

export function getHealthStatus(rate) {
  if (!Number.isFinite(rate)) return 'unknown';
  if (rate >= 99.9) return 'healthy';
  if (rate >= 99) return 'degraded';
  return 'offline';
}
