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
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLobeHubIcon } from '../../helpers/render';
import { formatTokens } from './format';
import GrowthText from './GrowthText';

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

function ModelList(props) {
  const { rows, variant } = props;
  const { t } = useTranslation();
  const compact = variant === 'compact';
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {rows.map((row) => (
        <li
          key={row.model_name}
          className='flex items-center gap-3'
          style={{ padding: compact ? '8px 0' : '10px 0' }}
        >
          <span
            className='shrink-0 text-right font-mono tabular-nums'
            style={{
              width: 24,
              fontSize: 12,
              color: 'var(--semi-color-text-2)',
            }}
          >
            {row.rank}.
          </span>
          <span className='shrink-0'>
            {getLobeHubIcon(row.vendor_icon, compact ? 20 : 22)}
          </span>
          <div className='min-w-0 flex-1'>
            <ModelLink
              modelName={row.model_name}
              className='block truncate font-mono font-medium'
              style={{
                fontSize: compact ? 12 : 14,
                color: 'var(--semi-color-text-0)',
              }}
            >
              {row.model_name}
            </ModelLink>
            <p
              className='truncate italic'
              style={{
                fontSize: compact ? 11 : 12,
                color: 'var(--semi-color-text-2)',
                margin: 0,
              }}
            >
              {t('rankings.leaderboard.by')}{' '}
              <VendorLink vendor={row.vendor}>
                {row.vendor.toLowerCase()}
              </VendorLink>
            </p>
          </div>
          <div className='shrink-0 text-right'>
            <div
              className='font-mono font-semibold tabular-nums'
              style={{
                fontSize: compact ? 12 : 14,
                color: 'var(--semi-color-text-0)',
              }}
            >
              {formatTokens(row.total_tokens)}
              {!compact && (
                <>
                  {' '}
                  <span style={{ color: 'var(--semi-color-text-2)', fontWeight: 400 }}>
                    {t('rankings.topModels.tokens')}
                  </span>
                </>
              )}
            </div>
            <GrowthText value={row.growth_pct} style={compact ? { fontSize: 10 } : { fontSize: 11 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ModelLeaderboard(props) {
  const { rows, variant, limit } = props;
  const limited = limit ? rows.slice(0, limit) : rows;
  const half = Math.ceil(limited.length / 2);
  const left = limited.slice(0, half);
  const right = limited.slice(half);
  const v = variant ?? 'default';

  if (limited.length === 0) {
    return null;
  }

  return (
    <div className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
      <ModelList rows={left} variant={v} />
      {right.length > 0 && <ModelList rows={right} variant={v} />}
    </div>
  );
}
