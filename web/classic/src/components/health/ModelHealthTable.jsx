import React, { useMemo, useState } from 'react';
import { Card, Table, Select, Tag, Input } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Search } from 'lucide-react';
import ModelHealthBadge from './ModelHealthBadge';
import { HEALTH_STATUS_MAP, formatLatency } from '../../constants/health.constants';
import './i18n';

export default function ModelHealthTable({ data, loading, onSelectModel }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.modelName.toLowerCase().includes(q) ||
          m.vendorName.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }
    return result;
  }, [data, search, statusFilter]);

  const columns = [
    {
      title: t('health.dashboard.modelName'),
      dataIndex: 'modelName',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <ModelHealthBadge
            health={record}
            modelName={text}
            size="default"
          />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: t('health.dashboard.vendor'),
      dataIndex: 'vendorName',
      render: (text) => text || '-',
      width: 120,
    },
    {
      title: t('health.dashboard.healthyChannels'),
      dataIndex: 'healthyChannels',
      width: 140,
      render: (text, record) => (
        <span>
          {text}/{record.totalChannels}
        </span>
      ),
    },
    {
      title: t('health.dashboard.avgLatency'),
      dataIndex: 'avgLatency',
      width: 120,
      render: (latency) => formatLatency(latency),
    },
    {
      title: t('health.dashboard.lastTested'),
      dataIndex: 'lastTested',
      width: 160,
      render: (ts) => {
        if (!ts || ts === 0) return '-';
        return new Date(ts * 1000).toLocaleString();
      },
    },
    {
      title: '',
      width: 60,
      render: (_, record) => (
        <span className="cursor-pointer text-blue-500 hover:text-blue-700 flex items-center gap-1">
          <span className="text-sm">{t('health.summary.viewDetails')}</span>
          <ArrowRight size={14} />
        </span>
      ),
    },
  ];

  return (
    <Card
      className="!rounded-2xl shadow-sm"
      bodyStyle={{ padding: 0 }}
    >
      <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
        <Input
          prefix={<Search size={14} />}
          placeholder={t('health.dashboard.searchModel')}
          value={search}
          onChange={setSearch}
          style={{ width: 240 }}
          size="small"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          size="small"
          style={{ width: 140 }}
          placeholder={t('health.dashboard.filterStatus')}
        >
          <Select.Option value="all">{t('health.dashboard.filterStatus')}: {t('health.dashboard.healthyModels')}</Select.Option>
          {Object.entries(HEALTH_STATUS_MAP).map(([key, meta]) => (
            <Select.Option key={key} value={key}>
              {t(meta.label)}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="key"
        size="small"
        pagination={false}
        onRow={(record) => ({
          onClick: () => onSelectModel(record),
          style: { cursor: 'pointer' },
        })}
      />
    </Card>
  );
}
