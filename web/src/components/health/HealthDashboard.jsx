import React, { useState } from 'react';
import { Spin, Button, Switch, Card } from '@douyinfe/semi-ui';
import { RefreshCw, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHealthData } from '../../hooks/health/useHealthData';
import ModelHealthTable from './ModelHealthTable';
import ChannelHealthPanel from './ChannelHealthPanel';
import { HEALTH_STATUS_MAP, HEALTH_STATUS } from '../../constants/health.constants';
import './i18n';

export default function HealthDashboard() {
  const { t } = useTranslation();
  const {
    healthTableData,
    statsSummary,
    loading,
    autoRefresh,
    setAutoRefresh,
    refresh,
  } = useHealthData();
  const [selectedModel, setSelectedModel] = useState(null);

  const statCards = [
    { key: 'total', labelKey: 'health.dashboard.totalModels', value: statsSummary.total, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: HEALTH_STATUS.HEALTHY, labelKey: 'health.dashboard.healthyModels', value: statsSummary.healthy, color: 'text-green-600', bg: 'bg-green-50' },
    { key: HEALTH_STATUS.DEGRADED, labelKey: 'health.dashboard.degradedModels', value: statsSummary.degraded, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { key: HEALTH_STATUS.OFFLINE, labelKey: 'health.dashboard.offlineModels', value: statsSummary.offline, color: 'text-red-600', bg: 'bg-red-50' },
    { key: HEALTH_STATUS.UNKNOWN, labelKey: 'health.dashboard.unknownModels', value: statsSummary.unknown, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Heart size={24} className="text-red-500" />
          <h1 className="text-xl font-bold">{t('health.dashboard.title')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('health.dashboard.autoRefresh')}</span>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
          </div>
          <Button
            icon={<RefreshCw size={14} />}
            loading={loading}
            onClick={refresh}
            size="small"
          >
            {t('health.dashboard.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {statCards.map((card) => (
          <Card
            key={card.key}
            className="!rounded-xl shadow-sm"
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <span className={`text-xs font-medium ${card.color}`}>
                  {card.value}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{t(card.labelKey)}</div>
          </Card>
        ))}
      </div>

      <ModelHealthTable
        data={healthTableData}
        loading={loading}
        onSelectModel={setSelectedModel}
      />

      {selectedModel && (
        <div className="mt-4">
          <ChannelHealthPanel
            channels={selectedModel.channels}
            modelName={selectedModel.modelName}
            onClose={() => setSelectedModel(null)}
          />
        </div>
      )}
    </div>
  );
}
