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
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useFieldArray, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  StaticDataTable,
  type StaticDataTableColumn,
} from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import type { TopupCampaignPeriodSetting } from '@/features/topup-campaign/lib/settings'

import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useSettingsForm } from '../hooks/use-settings-form'
import { useUpdateOptionsBatch } from '../hooks/use-update-option'
import { TopupCampaignPeriodDialog } from './topup-campaign-dialog'
import {
  newTopupCampaignDraft,
  sortCampaignPeriodsNewestFirst,
  toPeriodFormValues,
  toPeriodsOptionValue,
  topupCampaignDraftStatus,
  type TopupCampaignDraftStatus,
} from './topup-campaign-form'
import {
  createTopupCampaignSchema,
  MAX_TOPUP_CAMPAIGN_PERIODS,
  type TopupCampaignFormValues,
  type TopupCampaignPeriodFormValues,
} from './topup-campaign-schema'

const ENABLED_OPTION = 'topup_campaign_setting.enabled'
const PERIODS_OPTION = 'topup_campaign_setting.periods'

export interface TopupCampaignDefaults {
  enabled: boolean
  periods: TopupCampaignPeriodSetting[]
}

function displayDateTime(value: string): string {
  return value ? value.replace('T', ' ') : '—'
}

function statusBadge(
  status: TopupCampaignDraftStatus,
  t: (key: string) => string
) {
  if (status === 'live') {
    return <Badge>{t('Campaign live')}</Badge>
  }
  if (status === 'day') {
    return <Badge variant='secondary'>{t('Bonus day')}</Badge>
  }
  if (status === 'upcoming') {
    return <Badge variant='outline'>{t('Campaign upcoming')}</Badge>
  }
  return <Badge variant='outline'>{t('Campaign ended')}</Badge>
}

function campaignColumns(
  t: (key: string, options?: Record<string, unknown>) => string,
  onEdit: (index: number) => void,
  onDelete: (index: number) => void,
  canDelete: boolean
): StaticDataTableColumn<TopupCampaignPeriodFormValues>[] {
  return [
    {
      id: 'key',
      header: t('Campaign key'),
      cell: (period) => (
        <span className='font-mono text-xs'>{period.campaignKey || '—'}</span>
      ),
    },
    {
      id: 'window',
      header: t('Period (UTC+8)'),
      cell: (period) => (
        <span className='text-xs'>
          {displayDateTime(period.start)} – {displayDateTime(period.end)}
        </span>
      ),
    },
    {
      id: 'dayBonus',
      header: t('Day bonus'),
      cell: (period) =>
        period.dayBonusRatePercent > 0 ? (
          <span className='text-xs'>
            {period.dayBonusRatePercent}% · {displayDateTime(period.dayStart)} –{' '}
            {displayDateTime(period.dayEnd)}
          </span>
        ) : (
          <span className='text-muted-foreground text-xs'>
            {t('No bonus day')}
          </span>
        ),
    },
    {
      id: 'tiers',
      header: t('Tiers'),
      cell: (period) => t('Tiers: {{count}}', { count: period.tiers.length }),
    },
    {
      id: 'whitelist',
      header: t('Whitelist'),
      cell: (period) =>
        period.whitelistUserIds.trim()
          ? period.whitelistUserIds
          : t('All users'),
    },
    {
      id: 'status',
      header: t('Status'),
      cell: (period) => statusBadge(topupCampaignDraftStatus(period), t),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (period, index) => (
        <div className='flex justify-end gap-1'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onEdit(index)}
            aria-label={t('Edit campaign {{key}}', {
              key: period.campaignKey,
            })}
          >
            <Pencil className='size-4' />
            {t('Edit')}
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            onClick={() => onDelete(index)}
            disabled={!canDelete}
            aria-label={t('Delete campaign {{key}}', {
              key: period.campaignKey,
            })}
          >
            <Trash2 className='size-4' />
          </Button>
        </div>
      ),
    },
  ]
}

export function TopupCampaignSection(props: {
  defaultValues: TopupCampaignDefaults
}) {
  const { t } = useTranslation()
  const updateOptions = useUpdateOptionsBatch()
  const schema = useMemo(() => createTopupCampaignSchema(t), [t])
  const initialValues = useMemo<TopupCampaignFormValues>(
    () => ({
      enabled: props.defaultValues.enabled,
      periods: sortCampaignPeriodsNewestFirst(
        props.defaultValues.periods.map(toPeriodFormValues)
      ),
    }),
    [props.defaultValues]
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newDraftIndex, setNewDraftIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const { form, handleSubmit, markSaved, isDirty, isSubmitting } =
    useSettingsForm<TopupCampaignFormValues>({
      resolver: zodResolver(
        schema
      ) as unknown as Resolver<TopupCampaignFormValues>,
      defaultValues: initialValues,
      onSubmit: async (values, changedFields) => {
        const changedKeys = Object.keys(changedFields)
        const updates = []
        const periodsChanged = changedKeys.some(
          (key) => key === 'periods' || key.startsWith('periods.')
        )
        if (periodsChanged) {
          updates.push({
            key: PERIODS_OPTION,
            value: toPeriodsOptionValue(
              sortCampaignPeriodsNewestFirst(values.periods)
            ),
          })
        }
        if (changedKeys.includes('enabled')) {
          updates.push({
            key: ENABLED_OPTION,
            value: String(values.enabled),
          })
        }
        await updateOptions.mutateAsync(updates)
      },
    })
  const periods = useFieldArray({
    control: form.control,
    name: 'periods',
  })
  const periodValues = form.watch('periods')
  const disabled = updateOptions.isPending || isSubmitting
  const columns = campaignColumns(
    t,
    (index) => {
      setNewDraftIndex(null)
      setEditingIndex(index)
    },
    setDeleteIndex,
    periodValues.length > 1
  )

  const persistCampaigns = async (
    nextPeriods: TopupCampaignPeriodFormValues[]
  ) => {
    const nextEnabled = form.getValues('enabled')
    const updates = [
      {
        key: PERIODS_OPTION,
        value: toPeriodsOptionValue(nextPeriods),
      },
    ]
    if (form.formState.dirtyFields.enabled) {
      updates.push({
        key: ENABLED_OPTION,
        value: String(nextEnabled),
      })
    }
    await updateOptions.mutateAsync(updates)
    markSaved({ enabled: nextEnabled, periods: nextPeriods })
  }

  const handleAdd = () => {
    const draft = newTopupCampaignDraft(periodValues)
    const nextPeriods = sortCampaignPeriodsNewestFirst([...periodValues, draft])
    const index = nextPeriods.findIndex(
      (period) => period.campaignKey === draft.campaignKey
    )
    periods.replace(nextPeriods)
    setNewDraftIndex(index)
    setEditingIndex(index)
  }

  const handleDialogClose = () => {
    if (editingIndex !== null && editingIndex === newDraftIndex) {
      periods.remove(editingIndex)
    }
    setEditingIndex(null)
    setNewDraftIndex(null)
  }

  const handleDialogSubmit = async (
    index: number,
    values: TopupCampaignPeriodFormValues
  ) => {
    const nextPeriods = periodValues.map((period, periodIndex) =>
      periodIndex === index ? values : period
    )
    await persistCampaigns(sortCampaignPeriodsNewestFirst(nextPeriods))
    setEditingIndex(null)
    setNewDraftIndex(null)
  }

  return (
    <SettingsSection title={t('Top-up Campaign')}>
      <Form {...form}>
        <SettingsForm onSubmit={handleSubmit} autoComplete='off'>
          <SettingsPageFormActions
            onSave={handleSubmit}
            isSaving={disabled}
            isSaveDisabled={!isDirty}
            saveLabel={t('Save top-up campaign settings')}
          />

          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Enable top-up campaign')}</FormLabel>
                  <FormDescription>
                    {t(
                      'When disabled, the activity page shows a placeholder and no bonuses are granted.'
                    )}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />

          <div className='space-y-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <h3 className='text-sm font-medium'>{t('Campaigns')}</h3>
                <p className='text-muted-foreground text-xs'>
                  {t(
                    'Each campaign has its own dates, tiers, and optional bonus day.'
                  )}
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAdd}
                disabled={
                  disabled ||
                  periods.fields.length >= MAX_TOPUP_CAMPAIGN_PERIODS
                }
              >
                <Plus className='size-4' />
                {t('Add campaign')}
              </Button>
            </div>

            <StaticDataTable
              columns={columns}
              data={periodValues}
              emptyContent={t('No campaigns yet. Add one to get started.')}
            />

            <FormField
              control={form.control}
              name='periods'
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsForm>
      </Form>

      {editingIndex !== null && periodValues[editingIndex] ? (
        <TopupCampaignPeriodDialog
          title={t('Edit campaign')}
          initialValues={periodValues[editingIndex]}
          otherPeriods={periodValues.filter(
            (_, index) => index !== editingIndex
          )}
          isSaving={updateOptions.isPending}
          onClose={handleDialogClose}
          onSubmit={(values) => handleDialogSubmit(editingIndex, values)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null)
        }}
        title={t('Delete campaign')}
        desc={t('Delete this campaign? This cannot be undone.')}
        confirmText={t('Delete')}
        destructive
        isLoading={updateOptions.isPending}
        handleConfirm={async () => {
          if (deleteIndex !== null) {
            await persistCampaigns(
              sortCampaignPeriodsNewestFirst(
                periodValues.filter((_, index) => index !== deleteIndex)
              )
            )
          }
          setDeleteIndex(null)
        }}
      />
    </SettingsSection>
  )
}
