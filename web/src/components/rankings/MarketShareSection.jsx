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
import { PieChart } from 'lucide-react';
import { Card } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { initVChartSemiTheme } from '@visactor/vchart-semi-theme';
import { formatShare, formatTokens } from './format';

const PERIOD_KEYS = {
  today: 'rankings.marketShare.period.today',
  week: 'rankings.marketShare.period.week',
  month: 'rankings.marketShare.period.month',
  year: 'rankings.marketShare.period.year',
  all: 'rankings.marketShare.period.all',
};

const VENDOR_COLOURS = {
  OpenAI: '#10a37f',
  Anthropic: '#d97757',
  Google: '#4285f4',
  DeepSeek: '#7c5cff',
  Alibaba: '#ff9900',
  xAI: '#1f2937',
  Meta: '#1877f2',
  Moonshot: '#ec4899',
  Zhipu: '#06b6d4',
  Mistral: '#ff7000',
  ByteDance: '#3b82f6',
  Tencent: '#22c55e',
  MiniMax: '#a855f7',
  Cohere: '#fb923c',
  Baidu: '#ef4444',
  Others: '#94a3b8',
};

const FALLBACK_PALETTE = [
  '#0ea5e9', '#22c55e', '#a855f7', '#f97316', '#14b8a6',
  '#eab308', '#ec4899', '#84cc16', '#6366f1', '#10b981',
  '#f43f5e', '#0891b2', '#94a3b8',
];

function buildVendorColourMap(names) {
  const result = {};
  let fallbackIdx = 0;
  for (const name of names) {
    if (VENDOR_COLOURS[name]) {
      result[name] = VENDOR_COLOURS[name];
    } else {
      result[name] = FALLBACK_PALETTE[fallbackIdx % FALLBACK_PALETTE.length];
      fallbackIdx += 1;
    }
  }
  return result;
}

const MAX_VENDORS_IN_LIST = 12;

function VendorLink(props) {
  const { vendor, className, children } = props;
  return (
    <Link
      to={`/pricing?vendor=${encodeURIComponent(vendor)}`}
      className={className}
      style={{ textDecoration: 'underline', textUnderlineOffset: 2, textDecorationColor: 'currentColor', opacity: 0.4 }}
    >
      {children ?? vendor}
    </Link>
  );
}

function VendorList(props) {
  const { rows, colourMap } = props;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {rows.map((vendor) => (
        <li key={vendor.vendor} className='flex items-center gap-3' style={{ padding: '10px 0' }}>
          <span
            className='shrink-0 text-right font-mono tabular-nums'
            style={{ width: 24, fontSize: 12, color: 'var(--semi-color-text-2)' }}
          >
            {vendor.rank}.
          </span>
          <span
            aria-hidden
            className='shrink-0 rounded-full'
            style={{
              width: 10,
              height: 10,
              backgroundColor: colourMap[vendor.vendor] ?? '#94a3b8',
            }}
          />
          <VendorLink
            vendor={vendor.vendor}
            className='min-w-0 flex-1 truncate font-medium'
            style={{ fontSize: 14, color: 'var(--semi-color-text-0)' }}
          >
            {vendor.vendor}
          </VendorLink>
          <div className='shrink-0 text-right'>
            <div
              className='font-mono font-semibold tabular-nums'
              style={{ fontSize: 14, color: 'var(--semi-color-text-0)' }}
            >
              {formatTokens(vendor.total_tokens)}
            </div>
            <div
              className='font-mono tabular-nums'
              style={{ fontSize: 11, color: 'var(--semi-color-text-2)' }}
            >
              {formatShare(vendor.share)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function MarketShareSection(props) {
  const { history, rows, period } = props;
  const { t } = useTranslation();

  React.useEffect(() => {
    initVChartSemiTheme({ isWatchingThemeSwitch: true });
  }, []);

  const colourMap = useMemo(
    () => buildVendorColourMap(history.vendors.map((v) => v.name)),
    [history],
  );

  const orderedPoints = useMemo(() => {
    const order = new Map(
      history.vendors.map((v, idx) => [v.name, idx]),
    );
    return [...history.points].sort((a, b) => {
      const tsCmp = a.ts.localeCompare(b.ts);
      if (tsCmp !== 0) return tsCmp;
      return (order.get(a.vendor) ?? 999) - (order.get(b.vendor) ?? 999);
    });
  }, [history]);

  const spec = useMemo(() => {
    if (orderedPoints.length === 0) return null;
    return {
      type: 'bar',
      data: [{ id: 'vendor-share', values: orderedPoints }],
      xField: 'label',
      yField: 'share',
      seriesField: 'vendor',
      stack: true,
      paddingInner: 0.12,
      legends: { visible: false },
      color: { specified: colourMap },
      axes: [
        {
          orient: 'bottom',
          label: { autoHide: true, autoLimit: true },
          tick: { visible: false },
        },
        {
          orient: 'left',
          min: 0,
          max: 1,
          label: {
            formatMethod: (val) => `${Math.round(Number(val) * 100)}%`,
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
              key: (datum) => String(datum?.vendor ?? ''),
              value: (datum) =>
                `${(Number(datum?.share) * 100).toFixed(1)}% · ${formatTokens(Number(datum?.tokens) || 0)}`,
            },
          ],
        },
        dimension: {
          title: {
            value: (datum) => String(datum?.label ?? ''),
          },
          content: [
            {
              key: (datum) => String(datum?.vendor ?? ''),
              value: (datum) => Number(datum?.share) || 0,
            },
          ],
          updateContent: (array) => {
            return array
              .filter((item) => Number(item.value) > 0.001)
              .sort((a, b) => Number(b.value) - Number(a.value))
              .map((item) => ({
                key: item.key,
                value: `${(Number(item.value) * 100).toFixed(1)}%`,
              }));
          },
        },
      },
      animationAppear: { duration: 500 },
      background: 'transparent',
    };
  }, [colourMap, orderedPoints]);

  const visible = rows.slice(0, MAX_VENDORS_IN_LIST);
  const half = Math.ceil(visible.length / 2);
  const left = visible.slice(0, half);
  const right = visible.slice(half);

  return (
    <Card
      className='!rounded-xl overflow-hidden'
      bodyStyle={{ padding: 0 }}
    >
      {/* Chart block */}
      <div className='px-5 py-4'>
        <h2
          className='inline-flex items-center gap-2 text-base font-semibold'
          style={{ color: 'var(--semi-color-text-0)' }}
        >
          <PieChart size={16} style={{ color: 'var(--semi-color-primary)' }} />
          {t('rankings.marketShare.title')}
        </h2>
        <p style={{ color: 'var(--semi-color-text-2)', fontSize: 14, marginTop: 4 }}>
          {t(PERIOD_KEYS[period])}
        </p>
      </div>

      <div className='px-5 pb-5'>
        <div style={{ height: 288 }}>
          {spec ? (
            <VChart
              key={`vendor-share-${period}`}
              spec={spec}
            />
          ) : (
            <div
              className='flex h-full items-center justify-center'
              style={{ color: 'var(--semi-color-text-2)', fontSize: 12 }}
            >
              {t('rankings.marketShare.noHistory')}
            </div>
          )}
        </div>
      </div>

      {/* Vendor list block */}
      <div style={{ borderTop: '1px solid var(--semi-color-border)' }}>
        <div className='px-5 pt-4 pb-2'>
          <h3
            className='text-sm font-semibold'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            {t('rankings.marketShare.byAuthor')}
          </h3>
          <p style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 2 }}>
            {t('rankings.marketShare.byAuthorDesc')}
          </p>
        </div>
        {visible.length === 0 ? (
          <div
            className='px-5 py-8 text-center'
            style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }}
          >
            {t('rankings.marketShare.noVendors')}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-x-8 px-5 pt-1 pb-4 md:grid-cols-2'>
            <VendorList rows={left} colourMap={colourMap} />
            {right.length > 0 && <VendorList rows={right} colourMap={colourMap} />}
          </div>
        )}
      </div>
    </Card>
  );
}
