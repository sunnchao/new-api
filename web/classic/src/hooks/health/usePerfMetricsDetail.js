import { useState, useEffect, useCallback } from 'react';
import { getPerfMetrics } from '../../services/perfMetrics';

export function usePerfMetricsDetail(modelName, hours = 24) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!modelName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPerfMetrics(modelName, hours);
      if (res?.success && res?.data?.groups) {
        setGroups(res.data.groups);
      } else {
        setGroups([]);
      }
    } catch (err) {
      setError(err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [modelName, hours]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const summary = {
    avgTps:
      groups.length > 0
        ? groups.reduce((sum, g) => sum + (g.avg_tps || 0), 0) / groups.length
        : 0,
    avgLatencyMs:
      groups.length > 0
        ? groups.reduce((sum, g) => sum + (g.avg_latency_ms || 0), 0) /
          groups.length
        : 0,
    avgTtftMs:
      groups.length > 0
        ? groups.reduce((sum, g) => sum + (g.avg_ttft_ms || 0), 0) /
          groups.length
        : 0,
    successRate:
      groups.length > 0
        ? groups.reduce((sum, g) => sum + (g.success_rate || 0), 0) /
          groups.length
        : 0,
  };

  return { groups, summary, loading, error, refresh: fetchDetail };
}
