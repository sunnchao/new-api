import React from 'react';
import { Table, Tag, Spin } from '@douyinfe/semi-ui';
import { HeartPulse, Timer, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePerfMetricsDetail } from '../../hooks/health/usePerfMetricsDetail';
import {
  formatSuccessRate,
  formatLatencyMs,
  formatThroughput,
  getHealthColor,
} from '../../utils/perfFormat';
import { LatencyTrendChart, AvailabilityTrendChart } from './PerfTrendCharts';
import './i18n';

function StatCard({ icon: Icon, label, value, hint, color }) {
  return (
    <div className='bg-gray-50 rounded-lg p-3 flex flex-col gap-1'>
      <span className='text-xs text-gray-400 flex items-center gap-1.5'>
        <Icon size={12} />
        {label}
      </span>
      <span
        className='font-mono text-lg font-semibold tabular-nums'
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      {hint && <span className='text-xs text-gray-400'>{hint}</span>}
    </div>
  );
}

export default function ModelPerformancePanel({ modelName }) {
  const { t } = useTranslation();
  const { groups, summary, loading } = usePerfMetricsDetail(modelName, 24);

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <Spin size='large' />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className='text-center text-gray-400 py-12 text-sm'>
        {t('health.dashboard.noData')}
      </div>
    );
  }

  const rateColor = getHealthColor(summary.successRate);
  const incidentCount = groups.reduce((count, g) => {
    return count + (g.series || []).filter((p) => p.success_rate < 100).length;
  }, 0);

  const columns = [
    {
      title: t('health.dashboard.channelType'),
      dataIndex: 'group',
      width: 120,
      render: (text) => (
        <Tag size='small' color='blue' shape='circle'>
          {text}
        </Tag>
      ),
    },
    {
      title: 'TPS',
      dataIndex: 'avg_tps',
      align: 'right',
      render: (v) => (
        <span className='font-mono text-xs'>{formatThroughput(v)}</span>
      ),
    },
    {
      title: 'TTFT',
      dataIndex: 'avg_ttft_ms',
      align: 'right',
      render: (v) => (
        <span className='font-mono text-xs'>{formatLatencyMs(v)}</span>
      ),
    },
    {
      title: t('health.perf.avgLatency'),
      dataIndex: 'avg_latency_ms',
      align: 'right',
      render: (v) => (
        <span className='font-mono text-xs'>{formatLatencyMs(v)}</span>
      ),
    },
    {
      title: t('health.perf.successRate'),
      dataIndex: 'success_rate',
      align: 'right',
      render: (v) => (
        <Tag
          size='small'
          shape='circle'
          color={v >= 99.9 ? 'green' : v >= 99 ? 'yellow' : 'red'}
        >
          {formatSuccessRate(v)}
        </Tag>
      ),
    },
  ];

  const tableData = groups.map((g, i) => ({ ...g, key: i }));

  return (
    <div className='flex flex-col gap-4'>
      {/* KPI Cards */}
      <div className='grid grid-cols-3 gap-2'>
        <StatCard
          icon={Gauge}
          label='TPS'
          value={formatThroughput(summary.avgTps)}
        />
        <StatCard
          icon={Timer}
          label={t('health.perf.avgLatency')}
          value={formatLatencyMs(summary.avgLatencyMs)}
        />
        <StatCard
          icon={HeartPulse}
          label={t('health.perf.successRate')}
          value={formatSuccessRate(summary.successRate)}
          color={rateColor}
          hint={
            incidentCount > 0
              ? `${incidentCount} incidents`
              : undefined
          }
        />
      </div>

      {/* Per-group table */}
      <div>
        <div className='text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5'>
          <HeartPulse size={14} className='text-gray-400' />
          分组性能
        </div>
        <Table
          dataSource={tableData}
          columns={columns}
          pagination={false}
          size='small'
        />
      </div>

      {/* Latency trend */}
      <div>
        <div className='text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5'>
          <Timer size={14} className='text-gray-400' />
          延迟趋势 (24h)
        </div>
        <LatencyTrendChart groups={groups} />
      </div>

      {/* Availability trend */}
      <div>
        <div className='text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5'>
          <HeartPulse size={14} className='text-gray-400' />
          可用性趋势 (24h)
        </div>
        <AvailabilityTrendChart groups={groups} />
      </div>
    </div>
  );
}
