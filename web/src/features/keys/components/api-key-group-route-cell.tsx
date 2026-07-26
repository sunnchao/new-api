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
import { CornerDownRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { GroupBadge } from '@/components/group-badge'
import { StatusBadge } from '@/components/status-badge'

import type { ApiKey } from '../types'

type ApiKeyGroupRouteCellProps = {
  apiKey: ApiKey
  groupRatios: Record<string, number>
}

function parseGroupList(value?: string | null): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ApiKeyGroupRouteCell(props: ApiKeyGroupRouteCellProps) {
  const { t } = useTranslation()
  const primaryGroup = props.apiKey.group?.trim() || ''
  const routeGroups =
    primaryGroup === 'auto'
      ? [primaryGroup]
      : [primaryGroup, ...parseGroupList(props.apiKey.backup_group)]

  return (
    <div
      className='flex min-w-0 flex-col items-start gap-1.5 py-1'
      data-slot='api-key-group-route'
    >
      {routeGroups.map((group, index) => (
        <div
          key={index === 0 ? 'primary' : `backup-${group}`}
          className='grid w-full min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-2'
        >
          <span
            className='text-muted-foreground flex min-h-5 items-center gap-1 text-xs leading-5 font-medium'
            data-slot='api-key-group-route-role'
          >
            {index > 0 && (
              <CornerDownRight className='size-3 shrink-0' aria-hidden='true' />
            )}
            {index === 0
              ? t('Primary Group')
              : t('Backup Group {{count}}', { count: index })}
          </span>
          <span className='flex min-w-0 flex-wrap items-center gap-1.5'>
            <GroupBadge
              group={group}
              ratio={props.groupRatios[group]}
              wrapLabel
            />
            {group === 'auto' && props.apiKey.cross_group_retry && (
              <StatusBadge
                label={t('Cross-group retry')}
                variant='info'
                copyable={false}
              />
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
