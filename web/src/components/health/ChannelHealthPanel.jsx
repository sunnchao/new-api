import React, { useState } from 'react';
import { Card, Tag, Button, Table } from '@douyinfe/semi-ui';
import { Activity, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import { formatLatency } from '../../constants/health.constants';
import './i18n';

const STATUS_TAG_MAP = {
  1: { color: 'green', labelKey: 'health.status.online' },
  2: { color: 'red', labelKey: 'health.status.offline' },
  3: { color: 'yellow', labelKey: 'health.status.degraded' },
};

export default function ChannelHealthPanel({ channels, modelName, onClose }) {
  const { t } = useTranslation();
  const [testingIds, setTestingIds] = useState(new Set());

  const testChannel = async (channel) => {
    const id = channel.id;
    setTestingIds((prev) => new Set([...prev, id]));
    try {
      const res = await API.get(`/api/channel/test/${id}`);
      if (res.data?.success) {
        showSuccess(
          t('health.avgLatency', {
            latency: formatLatency(res.data.time * 1000),
          }),
        );
      } else {
        showError(res.data?.message || t('health.dashboard.noData'));
      }
    } catch {
      showError(t('health.dashboard.noData'));
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const columns = [
    {
      title: t('health.dashboard.channelName'),
      dataIndex: 'name',
      render: (text) => text || '-',
    },
    {
      title: t('health.dashboard.channelType'),
      dataIndex: 'type',
      render: (text) => text || '-',
      width: 100,
    },
    {
      title: t('health.dashboard.filterStatus'),
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const cfg = STATUS_TAG_MAP[status] || STATUS_TAG_MAP[2];
        return (
          <Tag color={cfg.color} shape="circle" size="small">
            {t(cfg.labelKey)}
          </Tag>
        );
      },
    },
    {
      title: t('health.dashboard.responseTime'),
      dataIndex: 'response_time',
      width: 120,
      render: (rt) => {
        if (rt === 0) return <Tag color="grey" shape="circle">{t('health.summary.notTested')}</Tag>;
        const color =
          rt <= 1000 ? 'green' : rt <= 3000 ? 'lime' : rt <= 5000 ? 'yellow' : 'red';
        return <Tag color={color} shape="circle">{formatLatency(rt)}</Tag>;
      },
    },
    {
      title: t('health.dashboard.priority'),
      dataIndex: 'priority',
      width: 80,
      render: (text) => text ?? '-',
    },
    {
      title: t('health.dashboard.weight'),
      dataIndex: 'weight',
      width: 80,
      render: (text) => text ?? '-',
    },
    {
      title: '',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          theme="light"
          loading={testingIds.has(record.id)}
          onClick={() => testChannel(record)}
        >
          {t('health.dashboard.testChannel')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      className="!rounded-2xl shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <Activity size={16} />
          <span>{modelName}</span>
          <span className="text-gray-400 text-sm">
            {t('health.dashboard.channelDetail')}
          </span>
        </div>
      }
      headerExtraContent={
        <Button
          icon={<X size={14} />}
          theme="borderless"
          type="tertiary"
          onClick={onClose}
          size="small"
        />
      }
    >
      <Table
        columns={columns}
        dataSource={channels}
        pagination={false}
        size="small"
        rowKey="id"
      />
    </Card>
  );
}
