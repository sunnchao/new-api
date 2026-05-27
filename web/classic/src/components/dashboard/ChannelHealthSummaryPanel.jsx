import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spin, Progress, Tag } from '@douyinfe/semi-ui';
import { Heart, RefreshCw, ArrowRight } from 'lucide-react';
import { IllustrationConstruction, IllustrationConstructionDark } from '@douyinfe/semi-illustrations';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API } from '../../helpers';
import { HEALTH_STATUS, deriveAvgLatency, formatLatency } from '../../constants/health.constants';
import '../health/i18n';

const CARD_PROPS = {
  shadows: 'always',
  bordered: true,
  headerLine: true,
};

export default function ChannelHealthSummaryPanel({ t }) {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/channel/', { params: { p: 0, page_size: 9999 } });
      if (res.data?.success && res.data?.data?.items) {
        setChannels(res.data.data.items);
      }
    } catch {
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const enabled = channels.filter((c) => c.status === 1);
    const avgLatency = deriveAvgLatency(channels);
    return {
      total: channels.length,
      healthy: enabled.length,
      degraded: channels.length - enabled.length,
      avgLatency,
    };
  }, [channels]);

  const barItems = [
    { key: HEALTH_STATUS.HEALTHY, label: t('health.status.online'), value: stats.healthy, stroke: 'var(--semi-color-primary)' },
    { key: HEALTH_STATUS.DEGRADED, label: t('health.status.degraded'), value: stats.degraded, stroke: 'var(--semi-color-warning)' },
  ];

  const filteredBarItems = barItems.filter((item) => item.value > 0);

  if (channels.length === 0 && !loading) {
    return (
      <Card
        {...CARD_PROPS}
        className='shadow-sm !rounded-2xl lg:col-span-1'
        title={
          <div className='flex items-center gap-2'>
            <Heart size={16} />
            {t('health.summary.title')}
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
      className='shadow-sm !rounded-2xl lg:col-span-1'
      title={
        <div className='flex items-center justify-between w-full gap-2'>
          <div className='flex items-center gap-2'>
            <Heart size={16} className='text-red-400' />
            {t('health.summary.title')}
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
          {filteredBarItems.map((item) => (
            <div key={item.key} className='mb-3 last:mb-0'>
              <div className='flex items-center justify-between text-xs mb-1'>
                <div className='flex items-center gap-1.5'>
                  <span
                    className='w-2 h-2 rounded-full inline-block'
                    style={{ backgroundColor: item.stroke }}
                  />
                  <span className='text-gray-600'>{item.label}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-gray-800'>{item.value}</span>
                  <Tag size='small' shape='circle' color='white'>
                    {stats.total > 0 ? `${((item.value / stats.total) * 100).toFixed(0)}%` : '0%'}
                  </Tag>
                </div>
              </div>
              <Progress
                percent={stats.total > 0 ? parseFloat(((item.value / stats.total) * 100).toFixed(1)) : 0}
                showInfo={false}
                stroke={item.stroke}
              />
            </div>
          ))}
        </div>

        <div className='px-4 pb-3 border-t border-gray-100'>
          <div className='flex items-center justify-between text-xs text-gray-500 pt-3'>
            <span>
              {t('health.summary.totalChannels')}: {stats.total}
              {stats.avgLatency != null && (
                <span className='ml-3'>
                  {t('health.summary.avgLatency')}: {formatLatency(stats.avgLatency)}
                </span>
              )}
            </span>
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
