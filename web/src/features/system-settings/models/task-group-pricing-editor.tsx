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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatPricingAmount,
  type PricingCurrency,
} from '@/features/model-pricing/currency'
import {
  getTaskNumberFields,
  taskMatrixRowLabel,
  type TaskMatrixRow,
} from '@/features/pricing/lib/task-expr'
import {
  cloneTaskGroupPricingRows,
  roundTaskGroupPrice,
  type TaskGroupPricingOverride,
} from '@/features/pricing/lib/task-group-expr'
import type { BillingUsageSchema } from '@/features/pricing/types'

import { TaskPricingMatrix } from './task-pricing-matrix'

type TaskGroupPricingEditorProps = {
  currency?: PricingCurrency
  usageSchema: BillingUsageSchema
  baseRows: TaskMatrixRow[]
  groups: Record<string, TaskGroupPricingOverride>
  availableGroups?: string[]
  onChange: (next: Record<string, TaskGroupPricingOverride>) => void
}

export function TaskGroupPricingEditor(props: TaskGroupPricingEditorProps) {
  const { t } = useTranslation()
  const groupNames = Object.keys(props.groups).sort()
  const addableGroups = useMemo(
    () =>
      [...new Set(props.availableGroups ?? [])]
        .filter((name) => !props.groups[name])
        .sort(),
    [props.availableGroups, props.groups]
  )
  const [selected, setSelected] = useState<string | null>(
    () => groupNames[0] ?? null
  )
  const [draftGroup, setDraftGroup] = useState<string | null>(null)
  const numberFields = getTaskNumberFields(props.usageSchema)
  const priceField = numberFields[0]?.[0]

  useEffect(() => {
    if (selected && props.groups[selected]) return
    setSelected(Object.keys(props.groups).sort()[0] ?? null)
  }, [props.groups, selected])

  const override = selected ? props.groups[selected] : null

  const updateOverride = (next: TaskGroupPricingOverride) => {
    if (!selected) return
    props.onChange({ ...props.groups, [selected]: next })
  }

  const addGroup = () => {
    const name = draftGroup?.trim()
    if (!name) return
    if (!props.groups[name]) {
      props.onChange({
        ...props.groups,
        [name]: {
          mode: 'price',
          rows: cloneTaskGroupPricingRows(props.baseRows),
        },
      })
    }
    setSelected(name)
    setDraftGroup(null)
  }

  const removeGroup = () => {
    if (!selected) return
    const next = { ...props.groups }
    delete next[selected]
    props.onChange(next)
    setSelected(Object.keys(next).sort()[0] ?? null)
  }

  const changeMode = (mode: TaskGroupPricingOverride['mode']) => {
    if (!override || mode === override.mode) return
    if (mode === 'multiplier') {
      const rows = props.baseRows.map((baseRow, index) => {
        const current = override.rows[index] ?? baseRow
        const basePrice = priceField ? (baseRow.unitPrices[priceField] ?? 0) : 0
        const currentPrice = priceField
          ? (current.unitPrices[priceField] ?? 0)
          : 0
        const multiplier =
          basePrice > 0 ? roundTaskGroupPrice(currentPrice / basePrice) : 1
        return {
          combination: { ...baseRow.combination },
          constant: baseRow.constant,
          unitPrices: { ...baseRow.unitPrices },
          multiplier: multiplier > 0 ? multiplier : 1,
        }
      })
      updateOverride({ mode, rows })
      return
    }

    const rows = props.baseRows.map((baseRow, index) => {
      const current = override.rows[index] ?? baseRow
      const multiplier = current.multiplier > 0 ? current.multiplier : 1
      return {
        combination: { ...baseRow.combination },
        constant: roundTaskGroupPrice(baseRow.constant * multiplier),
        unitPrices: Object.fromEntries(
          Object.entries(baseRow.unitPrices).map(([field, value]) => [
            field,
            roundTaskGroupPrice(value * multiplier),
          ])
        ),
        multiplier: 1,
      }
    })
    updateOverride({ mode, rows })
  }

  const changePriceRow = (index: number, next: TaskMatrixRow) => {
    if (!override) return
    const rows = [...override.rows]
    rows[index] = { ...next, multiplier: 1 }
    updateOverride({ ...override, rows })
  }

  const fillPriceColumn = (priceKey: string, value: number) => {
    if (!override) return
    const rows = override.rows.map((row) => {
      if (priceKey === 'constant') return { ...row, constant: value }
      return {
        ...row,
        unitPrices: { ...row.unitPrices, [priceKey]: value },
      }
    })
    updateOverride({ ...override, rows })
  }

  const changeMultiplier = (index: number, raw: string) => {
    if (!override) return
    const value = Number(raw)
    if (!Number.isFinite(value) || value <= 0) return
    const rows = override.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, multiplier: value } : row
    )
    updateOverride({ ...override, rows })
  }

  const resetRows = () => {
    if (!override) return
    updateOverride({
      ...override,
      rows: cloneTaskGroupPricingRows(props.baseRows),
    })
  }

  return (
    <div className='space-y-3 border-t pt-3'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h4 className='text-sm font-medium'>{t('Pricing by Group')}</h4>
        </div>
        <div className='flex flex-wrap items-end gap-2'>
          <Select
            items={addableGroups.map((name) => ({ value: name, label: name }))}
            value={draftGroup}
            onValueChange={setDraftGroup}
          >
            <SelectTrigger
              aria-label={t('Add group')}
              size='sm'
              className='w-36'
              disabled={addableGroups.length === 0}
            >
              <SelectValue placeholder={t('Select a group')} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {addableGroups.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={!draftGroup}
            onClick={addGroup}
          >
            {t('Add group')}
          </Button>
          {selected ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={removeGroup}
            >
              {t('Delete')}
            </Button>
          ) : null}
        </div>
      </div>

      {groupNames.length > 0 ? (
        <Select
          items={groupNames.map((name) => ({ value: name, label: name }))}
          value={selected}
          onValueChange={(value) => setSelected(value)}
        >
          <SelectTrigger aria-label={t('Select a group')} size='sm'>
            <SelectValue placeholder={t('Select a group')} />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {groupNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : null}

      {selected && override ? (
        <div className='space-y-3'>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <Select
              items={[
                { value: 'price', label: t('Fixed price') },
                { value: 'multiplier', label: t('Multiplier') },
              ]}
              value={override.mode}
              onValueChange={(value) =>
                value !== null &&
                changeMode(value as TaskGroupPricingOverride['mode'])
              }
            >
              <SelectTrigger aria-label={t('Price')} size='sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value='price'>{t('Fixed price')}</SelectItem>
                  <SelectItem value='multiplier'>{t('Multiplier')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={resetRows}
            >
              {t('Reset')}
            </Button>
          </div>

          {override.mode === 'price' ? (
            <TaskPricingMatrix
              currency={props.currency}
              rows={override.rows}
              usageSchema={props.usageSchema}
              matchedRowIndex={null}
              onRowChange={changePriceRow}
              onFillColumn={fillPriceColumn}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Applicable conditions')}</TableHead>
                  <TableHead className='text-right'>
                    {t('Multiplier')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {override.rows.map((row, index) => (
                  <TableRow key={JSON.stringify(row.combination)}>
                    <TableCell className='whitespace-normal'>
                      {taskMatrixRowLabel(row.combination) || t('All requests')}
                    </TableCell>
                    <TableCell className='text-right font-mono'>
                      {priceField
                        ? formatPricingAmount(
                            (row.unitPrices[priceField] ?? 0) * row.multiplier,
                            props.currency
                          )
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Input
                        type='number'
                        min={0.000001}
                        step={0.01}
                        value={row.multiplier}
                        aria-label={`${selected} ${taskMatrixRowLabel(row.combination)} ${t('Multiplier')}`}
                        onChange={(event) =>
                          changeMultiplier(index, event.target.value)
                        }
                        className='ml-auto w-28 font-mono'
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : null}
    </div>
  )
}
