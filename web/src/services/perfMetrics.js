import { API } from '../helpers';

export async function getPerfMetricsSummary(hours = 24) {
  const res = await API.get('/api/perf-metrics/summary', {
    params: { hours },
  });
  return res.data;
}

export async function getPerfMetrics(modelName, hours = 24) {
  const res = await API.get('/api/perf-metrics', {
    params: { model: modelName, hours },
  });
  return res.data;
}
