import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

function formatHourLabel(ts) {
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

export function LatencyTrendChart({ groups }) {
  const option = useMemo(() => {
    if (!groups || groups.length === 0) return null;

    const byTs = {};
    for (const group of groups) {
      for (const point of group.series || []) {
        if (point.avg_ttft_ms <= 0) continue;
        if (!byTs[point.ts]) byTs[point.ts] = [];
        byTs[point.ts].push(point.avg_ttft_ms);
      }
    }

    const sortedTs = Object.keys(byTs)
      .map(Number)
      .sort((a, b) => a - b);

    if (sortedTs.length === 0) return null;

    const xData = sortedTs.map(formatHourLabel);
    const yData = sortedTs.map((ts) => {
      const values = byTs[ts];
      return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = params[0];
          return `${p.axisValue}<br/>TTFT: <b>${p.value} ms</b>`;
        },
      },
      grid: { top: 20, right: 16, bottom: 30, left: 50 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: '{value} ms' },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: yData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 },
        },
      ],
    };
  }, [groups]);

  if (!option) {
    return (
      <div className='flex h-48 items-center justify-center rounded-lg border text-xs text-gray-400'>
        暂无延迟数据
      </div>
    );
  }

  return (
    <div className='h-64'>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export function AvailabilityTrendChart({ groups }) {
  const option = useMemo(() => {
    if (!groups || groups.length === 0) return null;

    const byTs = {};
    for (const group of groups) {
      for (const point of group.series || []) {
        if (!Number.isFinite(point.success_rate)) continue;
        if (!byTs[point.ts]) byTs[point.ts] = [];
        byTs[point.ts].push(point.success_rate);
      }
    }

    const sortedTs = Object.keys(byTs)
      .map(Number)
      .sort((a, b) => a - b);

    if (sortedTs.length === 0) return null;

    const xData = sortedTs.map(formatHourLabel);
    const yData = sortedTs.map((ts) => {
      const values = byTs[ts];
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      return Math.round(avg * 100) / 100;
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = params[0];
          return `${p.axisValue}<br/>成功率: <b>${p.value.toFixed(2)}%</b>`;
        },
      },
      grid: { top: 20, right: 16, bottom: 30, left: 50 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 95,
        max: 100,
        axisLabel: { fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: yData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: '#10b981' },
          itemStyle: {
            color: (params) => {
              const v = params.value;
              if (v >= 99.9) return '#10b981';
              if (v >= 99) return '#f59e0b';
              return '#ef4444';
            },
          },
          areaStyle: { opacity: 0.06, color: '#10b981' },
        },
      ],
    };
  }, [groups]);

  if (!option) {
    return (
      <div className='flex h-48 items-center justify-center rounded-lg border text-xs text-gray-400'>
        暂无可用性数据
      </div>
    );
  }

  return (
    <div className='h-56'>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
