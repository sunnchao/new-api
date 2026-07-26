import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getPerfMetricsSummary } from '../../services/perfMetrics';
import { getHealthStatus } from '../../utils/perfFormat';

export function useModelPricingHealth(models) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);
  const modelNamesRef = useRef(null);

  const modelsKey = useMemo(() => {
    if (!models || models.length === 0) return '';
    return models.map((m) => m.model_name).sort().join(',');
  }, [models]);

  const fetchSummary = useCallback(async () => {
    if (!models || models.length === 0) return;
    if (fetchedRef.current && modelNamesRef.current === modelsKey) return;
    modelNamesRef.current = modelsKey;

    let cancelled = false;
    setLoading(true);

    try {
      const res = await getPerfMetricsSummary(24);
      if (!cancelled && res?.success && res?.data?.models) {
        setSummaryData(res.data.models);
        fetchedRef.current = true;
      }
    } catch {
      if (!cancelled) setSummaryData(null);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }, [modelsKey, models]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const modelHealthMap = useMemo(() => {
    if (!summaryData || !models || models.length === 0) return {};

    const perfByName = {};
    for (const perf of summaryData) {
      perfByName[perf.model_name] = perf;
    }

    const map = {};
    for (const model of models) {
      const name = model.model_name;
      const perf = perfByName[name];
      if (perf) {
        map[name] = {
          successRate: perf.success_rate,
          avgLatencyMs: perf.avg_latency_ms,
          avgTps: perf.avg_tps,
          requestCount: perf.request_count || 0,
          status: getHealthStatus(perf.success_rate),
        };
      }
    }
    return map;
  }, [models, summaryData]);

  return { modelHealthMap, healthLoading: loading };
}
