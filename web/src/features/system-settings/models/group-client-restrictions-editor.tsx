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
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'

import { safeJsonParse } from '../utils/json-parser'

const sectionCardClassName = 'min-w-0 shadow-none'
const sectionHeaderClassName = 'gap-2 border-b'

// IDs must match the clients accepted by setting/group_client_restriction.go.
const RESTRICTION_CLIENTS = [
  { id: 'claude_code', label: 'Claude Code' },
  { id: 'codex', label: 'Codex' },
] as const

type GroupClientRestrictionsEditorProps = {
  value: string
  groupOptions: string[]
  onChange: (value: string) => void
}

export function GroupClientRestrictionsEditor(
  props: GroupClientRestrictionsEditorProps
) {
  const { t } = useTranslation()

  const restrictions = useMemo(() => {
    const parsed = safeJsonParse<Record<string, unknown> | null>(props.value, {
      fallback: {},
      silent: true,
    })
    const result: Record<string, string[]> = {}
    if (!parsed || typeof parsed !== 'object') return result
    for (const [group, clients] of Object.entries(parsed)) {
      result[group] = Array.isArray(clients)
        ? clients.filter((client) => typeof client === 'string')
        : []
    }
    return result
  }, [props.value])

  const groups = Object.keys(restrictions)
  const groupCandidates = props.groupOptions.filter(
    (name) => !Object.hasOwn(restrictions, name)
  )

  const emit = (next: Record<string, string[]>) => {
    props.onChange(JSON.stringify(next, null, 2))
  }

  const toggleClient = (group: string, client: string, allowed: boolean) => {
    const current = restrictions[group]
    const next = allowed
      ? [...current.filter((item) => item !== client), client]
      : current.filter((item) => item !== client)
    emit({ ...restrictions, [group]: next })
  }

  return (
    <Card className={sectionCardClassName}>
      <CardHeader className={sectionHeaderClassName}>
        <CardTitle>{t('Client restrictions')}</CardTitle>
        <CardDescription>
          {t(
            'Limit which clients can use each group. A group with no client selected is unrestricted.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex min-w-0 flex-col gap-3'>
        <Combobox
          options={groupCandidates.map((name) => ({
            value: name,
            label: name,
          }))}
          value={null}
          onValueChange={(name: string | null) => {
            if (name) emit({ ...restrictions, [name]: [] })
          }}
          className='w-full sm:w-72'
          placeholder={t('Add group')}
          aria-label={t('Add group')}
        />
        {groups.length === 0 ? (
          <EmptyState
            className='min-h-40'
            title={t('No client restrictions configured')}
            description={t(
              'Add a group to allow only specific clients to use it.'
            )}
          />
        ) : (
          <ul className='flex flex-col gap-2'>
            {groups.map((group) => (
              <li
                key={group}
                className='bg-background flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3'
              >
                <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
                  <span
                    className='min-w-0 truncate text-sm font-medium'
                    title={group}
                  >
                    {group}
                  </span>
                  {!props.groupOptions.includes(group) && (
                    <StatusBadge variant='danger' copyable={false}>
                      <AlertTriangle className='mr-1 h-3 w-3' />
                      {t('Not in pricing table')}
                    </StatusBadge>
                  )}
                  {restrictions[group].length === 0 && (
                    <StatusBadge
                      variant='neutral'
                      label={t('Unrestricted')}
                      copyable={false}
                    />
                  )}
                </div>
                <div
                  role='group'
                  aria-label={t('Allowed clients for {{group}}', { group })}
                  className='flex shrink-0 items-center gap-4'
                >
                  {RESTRICTION_CLIENTS.map((client) => (
                    <Label
                      key={client.id}
                      className='flex items-center gap-2 text-sm font-normal'
                    >
                      <Checkbox
                        checked={restrictions[group].includes(client.id)}
                        onCheckedChange={(checked) =>
                          toggleClient(group, client.id, checked === true)
                        }
                      />
                      {client.label}
                    </Label>
                  ))}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('Remove {{group}}', { group })}
                  onClick={() =>
                    emit(
                      Object.fromEntries(
                        Object.entries(restrictions).filter(
                          ([name]) => name !== group
                        )
                      )
                    )
                  }
                >
                  <Trash2 aria-hidden='true' />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
