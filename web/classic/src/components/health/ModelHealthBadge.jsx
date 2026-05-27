import React from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  formatLatencyMs,
  formatThroughput,
  formatSuccessRate,
  getHealthColor,
} from '../../utils/perfFormat';
import './i18n';

export default function ModelHealthBadge({
  health,
  modelName,
  size = 'small',
  showTooltip = true,
}) {
  const { t } = useTranslation();

  if (!health) return null;

  const color = getHealthColor(health.successRate);

  if (size === 'default') {
    return (
      <div className='flex items-center gap-3 text-xs tabular-nums'>
        <div className='min-w-0'>
          <div className='text-gray-400 text-[10px] leading-4'>{t('health.perf.latencyShort')}</div>
          <div className='font-mono text-xs leading-4 text-gray-600 whitespace-nowrap'>
            {health.avgLatencyMs > 0 ? formatLatencyMs(health.avgLatencyMs) : '—'}
          </div>
        </div>
        <div className='min-w-0'>
          <div className='text-gray-400 text-[10px] leading-4'>{t('health.perf.throughputShort')}</div>
          <div className='font-mono text-xs leading-4 text-gray-600 whitespace-nowrap'>
            {formatThroughput(health.avgTps).replace(' t/s', 'tps')}
          </div>
        </div>
        <div className='min-w-0'>
          <div className='text-gray-400 text-[10px] leading-4'>{t('health.perf.statusShort')}</div>
          <div className='flex h-4 items-end gap-0.5'>
            <span className='bg-gray-200 h-2 w-1 rounded-full' />
            <span className='bg-gray-300 h-2.5 w-1 rounded-full' />
            <span className='h-3 w-1 rounded-full' style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>
    );
  }

  const badge = (
    <span
      className='inline-block w-2.5 h-2.5 rounded-full flex-shrink-0'
      style={{ backgroundColor: color }}
    />
  );

  if (!showTooltip) return badge;

  const tooltipContent = (
    <div className='text-xs'>
      <div className='font-medium mb-1'>{modelName}</div>
      <div>{t('health.perf.successRate')}: {formatSuccessRate(health.successRate)}</div>
      <div>{t('health.perf.avgLatency')}: {formatLatencyMs(health.avgLatencyMs)}</div>
      <div>{t('health.perf.throughput')}: {formatThroughput(health.avgTps)}</div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position='top'>
      {badge}
    </Tooltip>
  );
}
