/*
Copyright (C) 2023-2026 QuantumNous

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

import React, { useMemo } from 'react';
import { VChart } from '@visactor/react-vchart';
import { BarChart3, Trophy } from 'lucide-react';
import { Card } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { initVChartSemiTheme } from '@visactor/vchart-semi-theme';
import { formatTokens } from './format';
import ModelLeaderboard from './ModelLeaderboard';

const PERIOD_KEYS = {
  today: 'rankings.topModels.period.today',
  week: 'rankings.topModels.period.week',
  month: 'rankings.topModels.period.month',
  year: 'rankings.topModels.period.year',
  all: 'rankings.topModels.period.all',
};

const TOOLTIP_MAX_ROWS = 10;

export default function ModelsSection(props) {
  const { history, rows, period } = props;
  const { t } = useTranslation();

  // Init VChart Semi theme once
  React.useEffect(() => {
    initVChartSemiTheme({ isWatchingThemeSwitch: true });
  }, []);

  // Order points so the largest model appears at the bottom of every stack.
  const orderedPoints = useMemo(() => {
    const order = new Map(
      history.models.map((m, idx) => [m.name, idx]),
    );
    return [...history.points].sort((a, b) => {
      const tsCmp = a.ts.localeCompare(b.ts);
      if (tsCmp !== 0) return tsCmp;
      return (order.get(a.model) ?? 999) - (order.get(b.model) ?? 999);
    });
  }, [history]);

  const totalTokens = useMemo(
    () => rows.reduce((s, r) => s + r.total_tokens, 0),
    [rows],
  );

  const spec = useMemo(() => {
    if (orderedPoints.length === 0) return null;
    return {
      type: 'bar',
      data: [{ id: 'models-history', values: orderedPoints }],
      xField: 'label',
      yField: 'tokens',
      seriesField: 'model',
      stack: true,
      legends: { visible: false },
      axes: [
        {
          orient: 'bottom',
          label: { autoHide: true, autoLimit: true },
          tick: { visible: false },
        },
        {
          orient: 'left',
          label: {
            formatMethod: (val) => formatTokens(Number(val)),
          },
          grid: {
            visible: true,
            style: { lineDash: [3, 3] },
          },
        },
      ],
      tooltip: {
        mark: {
          content: [
            {
              key: (datum) => String(datum?.model ?? ''),
              value: (datum) => formatTokens(Number(datum?.tokens) || 0),
            },
          ],
        },
        dimension: {
          title: {
            value: (datum) => String(datum?.label ?? ''),
          },
          content: [
            {
              key: (datum) => String(datum?.model ?? ''),
              value: (datum) => Number(datum?.tokens) || 0,
            },
          ],
          updateContent: (array) => {
            array.sort((a, b) => Number(b.value) - Number(a.value));
            const sum = array.reduce((s, x) => s + (Number(x.value) || 0), 0);
            const visible = array.slice(0, TOOLTIP_MAX_ROWS);
            const overflow = array.slice(TOOLTIP_MAX_ROWS);
            const result = visible.map((item) => ({
              key: item.key,
              value: formatTokens(Number(item.value) || 0),
            }));
            if (overflow.length > 0) {
              const otherSum = overflow.reduce(
                (s, item) => s + (Number(item.value) || 0),
                0,
              );
              result.push({
                key: t('rankings.more', { count: overflow.length }),
                value: formatTokens(otherSum),
              });
            }
            result.unshift({
              key: t('rankings.total'),
              value: formatTokens(sum),
            });
            return result;
          },
        },
      },
      animationAppear: { duration: 500 },
      background: 'transparent',
    };
  }, [orderedPoints, t]);

  return (
    <Card
      className='!rounded-xl overflow-hidden'
      bodyStyle={{ padding: 0 }}
    >
      {/* Chart block */}
      <div className='flex items-start justify-between gap-4 px-5 py-4'>
        <div className='min-w-0 flex-1'>
          <h2
            className='inline-flex items-center gap-2 text-base font-semibold'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            <BarChart3 size={16} style={{ color: 'var(--semi-color-primary)' }} />
            {t('rankings.topModels.title')}
          </h2>
          <p style={{ color: 'var(--semi-color-text-2)', fontSize: 14, marginTop: 4 }}>
            {t(PERIOD_KEYS[period])}
          </p>
        </div>
        <div className='shrink-0 text-right'>
          <div
            className='font-mono text-2xl font-semibold tabular-nums'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            {formatTokens(totalTokens)}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--semi-color-text-2)',
            }}
          >
            {t('rankings.topModels.tokens')}
          </div>
        </div>
      </div>

      <div className='px-5 pb-5'>
        <div style={{ height: 288 }}>
          {spec ? (
            <VChart
              key={`models-history-${period}`}
              spec={spec}
            />
          ) : (
            <div
              className='flex h-full items-center justify-center'
              style={{ color: 'var(--semi-color-text-2)', fontSize: 12 }}
            >
              {t('rankings.topModels.noHistory')}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard block */}
      <div style={{ borderTop: '1px solid var(--semi-color-border)' }}>
        <div className='px-5 pt-4 pb-2'>
          <h3
            className='inline-flex items-center gap-2 text-sm font-semibold'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            <Trophy size={14} style={{ color: '#f59e0b' }} />
            {t('rankings.leaderboard.title')}
          </h3>
          <p style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 2 }}>
            {t('rankings.leaderboard.description')}
          </p>
        </div>
        {rows.length === 0 ? (
          <div
            className='px-5 py-8 text-center'
            style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }}
          >
            {t('rankings.leaderboard.noModels')}
          </div>
        ) : (
          <div className='px-5 pt-1 pb-4'>
            <ModelLeaderboard rows={rows} />
          </div>
        )}
      </div>
    </Card>
  );
}
