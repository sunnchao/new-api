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

import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLobeHubIcon } from '../../helpers/render';

function ModelLink(props) {
  const { modelName, className, children } = props;
  return (
    <Link
      to={`/pricing/${encodeURIComponent(modelName)}`}
      className={className}
      style={{ textDecoration: 'underline', textUnderlineOffset: 4, textDecorationColor: 'rgba(var(--semi-color-text-1-rgb), 0.3)' }}
    >
      {children ?? modelName}
    </Link>
  );
}

function VendorLink(props) {
  const { vendor, children } = props;
  return (
    <Link
      to={`/pricing?vendor=${encodeURIComponent(vendor)}`}
      style={{ textDecoration: 'underline', textUnderlineOffset: 2, textDecorationColor: 'currentColor', opacity: 0.4 }}
    >
      {children ?? vendor}
    </Link>
  );
}

function PulseCard(props) {
  const { title, description, icon, children } = props;
  return (
    <Card
      className='!rounded-xl overflow-hidden'
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ borderBottom: '1px solid var(--semi-color-border)', padding: '12px 16px' }}>
        <h3
          className='inline-flex items-center gap-2 text-sm font-semibold'
          style={{ color: 'var(--semi-color-text-0)' }}
        >
          {icon}
          {title}
        </h3>
        <p style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 2 }}>
          {description}
        </p>
      </div>
      <div style={{ padding: '4px 0' }}>{children}</div>
    </Card>
  );
}

function PulseEmpty(props) {
  const { label } = props;
  return (
    <div
      className='px-4 py-6 text-center'
      style={{ color: 'var(--semi-color-text-2)', fontSize: 12 }}
    >
      {label}
    </div>
  );
}

function MoverRow(props) {
  const { row, intent } = props;
  const isUp = intent === 'up';
  return (
    <li className='flex items-center gap-3' style={{ padding: '8px 16px' }}>
      <span className='shrink-0'>{getLobeHubIcon(row.vendor_icon, 20)}</span>
      <div className='min-w-0 flex-1'>
        <ModelLink
          modelName={row.model_name}
          className='block truncate font-mono font-medium'
          style={{ fontSize: 12, color: 'var(--semi-color-text-0)' }}
        >
          {row.model_name}
        </ModelLink>
        <p className='truncate' style={{ fontSize: 11, color: 'var(--semi-color-text-2)', margin: 0 }}>
          #{row.current_rank} ·{' '}
          <VendorLink vendor={row.vendor}>
            {row.vendor.toLowerCase()}
          </VendorLink>
        </p>
      </div>
      <span
        className='inline-flex shrink-0 items-center gap-0.5 font-mono text-xs font-semibold tabular-nums'
        style={{ color: isUp ? '#059669' : '#e11d48' }}
      >
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(row.rank_delta)}
      </span>
    </li>
  );
}

export default function PulseSection(props) {
  const { movers, droppers } = props;
  const { t } = useTranslation();

  return (
    <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <PulseCard
        title={t('rankings.pulse.up')}
        description={t('rankings.pulse.upDesc')}
        icon={<TrendingUp size={16} style={{ color: '#10b981' }} />}
      >
        {movers.length === 0 ? (
          <PulseEmpty label={t('rankings.pulse.noClimbers')} />
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {movers.map((row) => (
              <MoverRow key={row.model_name} row={row} intent='up' />
            ))}
          </ul>
        )}
      </PulseCard>

      <PulseCard
        title={t('rankings.pulse.down')}
        description={t('rankings.pulse.downDesc')}
        icon={<TrendingDown size={16} style={{ color: '#f43f5e' }} />}
      >
        {droppers.length === 0 ? (
          <PulseEmpty label={t('rankings.pulse.noDroppers')} />
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {droppers.map((row) => (
              <MoverRow key={row.model_name} row={row} intent='down' />
            ))}
          </ul>
        )}
      </PulseCard>
    </section>
  );
}
