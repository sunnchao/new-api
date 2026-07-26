/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spin, Tag, Skeleton } from '@douyinfe/semi-ui';
import { HeartPulse, Timer, Gauge, ArrowRight, RefreshCw } from 'lucide-react';
import { IllustrationConstruction } from '@douyinfe/semi-illustrations';
import { useNavigate } from 'react-router-dom';
import { getPerfMetricsSummary } from '../../services/perfMetrics';
import {
  formatSuccessRate,
  formatLatencyMs,
  formatThroughput,
  getHealthColor,
} from '../../utils/perfFormat';
import '../health/i18n';

const CARD_PROPS = {
  shadows: 'always',
  bordered: true,
  headerLine: true,
};

const TOP_MODEL_LIMIT = 5;

function simpleAverage(models, metric, isValid) {
  let total = 0;
  let count = 0;
  for (const m of models) {
    const v = Number(m[metric]);
    if (!isValid(v)) continue;
    total += v;
    count++;
  }
  return count > 0 ? total / count : NaN;
}

export default function PerformanceHealthSummaryPanel({ t }) {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPerfMetricsSummary(24);
      if (res?.success && res?.data?.models) {
        setModels(res.data.models);
      }
    } catch {
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(
    () => ({
      successRate: simpleAverage(models, 'success_rate', Number.isFinite),
      avgLatencyMs: simpleAverage(
        models,
        'avg_latency_ms',
        (v) => Number.isFinite(v) && v > 0,
      ),
      avgTps: simpleAverage(models, 'avg_tps', (v) => Number.isFinite(v) && v > 0),
    }),
    [models],
  );

  const topModels = useMemo(() => models.slice(0, TOP_MODEL_LIMIT), [models]);

  if (!loading && models.length === 0) {
    return (
      <Card
        {...CARD_PROPS}
        className='shadow-sm !rounded-2xl lg:col-span-2'
        title={
          <div className='flex items-center gap-2'>
            <HeartPulse size={16} />
            {t('health.perf.title')}
          </div>
        }
        bodyStyle={{ padding: 0 }}
      >
        <div className='flex justify-center items-center py-8'>
          <div className='text-center text-gray-400'>
            <IllustrationConstruction style={{ width: 96, height: 96 }} />
            <div className='text-xs mt-2'>{t('health.dashboard.noData')}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      {...CARD_PROPS}
      className='shadow-sm !rounded-2xl lg:col-span-2'
      title={
        <div className='flex items-center justify-between w-full gap-2'>
          <div className='flex items-center gap-2'>
            <HeartPulse size={16} className='text-red-400' />
            {t('health.perf.title')}
          </div>
          <Button
            icon={<RefreshCw size={14} />}
            onClick={loadData}
            loading={loading}
            size='small'
            theme='borderless'
            type='tertiary'
            className='text-gray-500 hover:text-blue-500 hover:bg-blue-50 !rounded-full'
          />
        </div>
      }
      bodyStyle={{ padding: 0 }}
    >
      <Spin spinning={loading}>
        <div className='p-4'>
          <div className='grid grid-cols-3 gap-2 mb-3'>
            <MetricCell
              icon={HeartPulse}
              label={t('health.perf.successRate')}
              value={formatSuccessRate(summary.successRate)}
              loading={loading}
              valueColor={getHealthColor(summary.successRate)}
            />
            <MetricCell
              icon={Timer}
              label={t('health.perf.avgLatency')}
              value={formatLatencyMs(summary.avgLatencyMs)}
              loading={loading}
            />
            <MetricCell
              icon={Gauge}
              label={t('health.perf.throughput')}
              value={formatThroughput(summary.avgTps)}
              loading={loading}
            />
          </div>

          {loading ? (
            <div className='space-y-1'>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className='h-5 w-full rounded' />
              ))}
            </div>
          ) : (
            topModels.length > 0 && (
              <div>
                <span className='text-gray-400 text-xs font-medium mb-1 block'>
                  {t('health.perf.topModels')}
                </span>
                <div className='grid grid-cols-1 gap-x-4 sm:grid-cols-2'>
                  {topModels.map((model) => (
                    <div
                      key={model.model_name}
                      className='flex items-center justify-between gap-2 rounded px-1.5 py-1'
                    >
                      <span className='min-w-0 flex-1 truncate font-mono text-xs'>
                        {model.model_name}
                      </span>
                      <span className='inline-flex shrink-0 items-center gap-1'>
                        <span
                          className='w-1.5 h-1.5 rounded-full inline-block'
                          style={{
                            backgroundColor: getHealthColor(model.success_rate),
                          }}
                        />
                        <span
                          className='font-mono text-xs font-semibold'
                          style={{ color: getHealthColor(model.success_rate) }}
                        >
                          {formatSuccessRate(model.success_rate)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        <div className='px-4 pb-3 border-t border-gray-100'>
          <div className='flex items-center justify-end text-xs text-gray-500 pt-3'>
            <Tag
              size='small'
              color='blue'
              className='cursor-pointer'
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/console/health')}
            >
              <span className='flex items-center gap-1'>
                {t('health.summary.viewDetails')}
                <ArrowRight size={12} />
              </span>
            </Tag>
          </div>
        </div>
      </Spin>
    </Card>
  );
}

function MetricCell({ icon: Icon, label, value, loading, valueColor }) {
  return (
    <div className='bg-gray-50 rounded-lg px-3 py-2'>
      <div className='flex items-center gap-1.5 text-xs text-gray-400 font-medium'>
        <Icon size={12} className='shrink-0' />
        <span className='truncate'>{label}</span>
      </div>
      {loading ? (
        <Skeleton className='mt-1.5 h-5 w-16' />
      ) : (
        <div
          className='mt-1.5 font-mono text-sm font-semibold tabular-nums'
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </div>
      )}
    </div>
  );
}
