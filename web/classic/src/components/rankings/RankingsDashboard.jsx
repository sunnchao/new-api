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

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Spin, Tabs, TabPane, Empty } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API } from '../../helpers';
import ModelsSection from './ModelsSection';
import MarketShareSection from './MarketShareSection';
import PulseSection from './PulseSection';
import './i18n';

const VALID_PERIODS = ['today', 'week', 'month', 'year', 'all'];
const DEFAULT_PERIOD = 'week';

const PERIOD_TAB_KEYS = [
  { id: 'today', i18nKey: 'rankings.period.today' },
  { id: 'week', i18nKey: 'rankings.period.week' },
  { id: 'month', i18nKey: 'rankings.period.month' },
  { id: 'year', i18nKey: 'rankings.period.year' },
  { id: 'all', i18nKey: 'rankings.period.all' },
];

export default function RankingsDashboard() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const period =
    VALID_PERIODS.includes(searchParams.get('period'))
      ? searchParams.get('period')
      : DEFAULT_PERIOD;

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/api/rankings', {
        params: { period },
      });
      const { success, data, message } = res.data;
      if (success && data) {
        setSnapshot(data);
      } else {
        setError(message || t('rankings.error.title'));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t('rankings.error.title'),
      );
    } finally {
      setLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const handlePeriodChange = (newPeriod) => {
    setSearchParams({ period: newPeriod });
  };

  return (
    <div
      className='relative mx-auto w-full'
      style={{ maxWidth: 1280, padding: '64px 12px 48px' }}
    >
      {/* Hero section */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--semi-color-text-2)',
          }}
        >
          {t('rankings.hero.label')}
        </p>
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--semi-color-text-0)',
          }}
        >
          {t('rankings.hero.title')}
        </h1>
        <p
          style={{
            maxWidth: 672,
            fontSize: 14,
            color: 'var(--semi-color-text-2)',
            marginTop: 8,
          }}
        >
          {t('rankings.hero.description')}
        </p>

        {/* Period tabs */}
        <Tabs
          activeKey={period}
          onChange={handlePeriodChange}
          type='button'
          style={{ marginTop: 20 }}
        >
          {PERIOD_TAB_KEYS.map((p) => (
            <TabPane key={p.id} tab={t(p.i18nKey)} itemKey={p.id} />
          ))}
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className='flex items-center justify-center' style={{ minHeight: 300 }}>
          <Spin size='large' />
        </div>
      ) : error ? (
        <div
          style={{
            border: '1px dashed var(--semi-color-border)',
            borderRadius: 12,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--semi-color-text-0)',
            }}
          >
            {t('rankings.error.title')}
          </h2>
          <p
            style={{
              maxWidth: 400,
              margin: '8px auto 0',
              fontSize: 14,
              color: 'var(--semi-color-text-2)',
            }}
          >
            {error}
          </p>
        </div>
      ) : snapshot ? (
        <div className='space-y-8'>
          <ModelsSection
            history={snapshot.models_history}
            rows={snapshot.models}
            period={period}
          />
          <MarketShareSection
            history={snapshot.vendor_share_history}
            rows={snapshot.vendors}
            period={period}
          />
          <PulseSection
            movers={snapshot.top_movers}
            droppers={snapshot.top_droppers}
          />
        </div>
      ) : (
        <Empty description={t('rankings.error.title')} />
      )}
    </div>
  );
}
