import { useState, useEffect, useCallback, useMemo } from 'react';
import { API, showError } from '../../helpers';
import {
  deriveModelHealth,
  deriveAvgLatency,
  HEALTH_STATUS,
} from '../../constants/health.constants';
import { normalizeHealthModelsPayload } from './useHealthDataUtils';

export function useHealthData() {
  const [models, setModels] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [modelsRes, channelsRes] = await Promise.all([
        API.get('/api/models/'),
        API.get('/api/channel/', { params: { p: 0, page_size: 9999 } }),
      ]);

      if (modelsRes.data?.success) {
        setModels(normalizeHealthModelsPayload(modelsRes.data.data));
      }
      if (channelsRes.data?.success && channelsRes.data?.data?.items) {
        setChannels(channelsRes.data.data.items);
      }
    } catch (error) {
      showError('Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const channelMap = useMemo(() => {
    const map = {};
    for (const ch of channels) {
      map[ch.id] = ch;
    }
    return map;
  }, [channels]);

  const healthTableData = useMemo(() => {
    return models
      .filter(
        (m) => m.bound_channels && m.bound_channels.length > 0,
      )
      .map((model) => {
        const boundChannels = (model.bound_channels || [])
          .map((bc) => {
            const ch = channelMap[bc.id];
            if (!ch) return null;
            return {
              id: ch.id,
              name: ch.name,
              type: ch.type,
              status: ch.status,
              response_time: ch.response_time,
              test_time: ch.test_time,
              priority: ch.priority,
              weight: ch.weight,
            };
          })
          .filter(Boolean);

        const healthyCount = boundChannels.filter(
          (c) => c.status === 1,
        ).length;
        const avgLatency = deriveAvgLatency(boundChannels);

        return {
          key: model.id || model.model_name,
          modelName: model.model_name,
          vendorName: model.vendor_name || '-',
          totalChannels: boundChannels.length,
          healthyChannels: healthyCount,
          status: deriveModelHealth(boundChannels),
          avgLatency,
          lastTested: Math.max(
            ...boundChannels.map((c) => c.test_time || 0),
          ),
          channels: boundChannels,
        };
      });
  }, [models, channelMap]);

  const statsSummary = useMemo(() => {
    const total = healthTableData.length + models.filter((m) => !m.bound_channels || m.bound_channels.length === 0).length;
    const healthy = healthTableData.filter(
      (m) => m.status === HEALTH_STATUS.HEALTHY,
    ).length;
    const degraded = healthTableData.filter(
      (m) => m.status === HEALTH_STATUS.DEGRADED,
    ).length;
    const offline = healthTableData.filter(
      (m) => m.status === HEALTH_STATUS.OFFLINE,
    ).length;
    const unknown = models.filter((m) => !m.bound_channels || m.bound_channels.length === 0).length;

    return { total, healthy, degraded, offline, unknown };
  }, [healthTableData, models]);

  return {
    healthTableData,
    statsSummary,
    loading,
    autoRefresh,
    setAutoRefresh,
    refresh: loadData,
  };
}
