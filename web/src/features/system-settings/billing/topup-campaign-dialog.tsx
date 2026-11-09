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
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { campaignPeriodsOverlap } from './topup-campaign-form'
import {
  createTopupCampaignPeriodSchema,
  MAX_TOPUP_CAMPAIGN_TIERS,
  type TopupCampaignPeriodFormValues,
} from './topup-campaign-schema'

export function TopupCampaignPeriodDialog(props: {
  title: string
  initialValues: TopupCampaignPeriodFormValues
  otherPeriods: TopupCampaignPeriodFormValues[]
  isSaving?: boolean
  onClose: () => void
  onSubmit: (values: TopupCampaignPeriodFormValues) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const schema = useMemo(() => createTopupCampaignPeriodSchema(t), [t])
  const form = useForm<TopupCampaignPeriodFormValues>({
    resolver: zodResolver(
      schema
    ) as unknown as Resolver<TopupCampaignPeriodFormValues>,
    defaultValues: props.initialValues,
  })
  const tiers = useFieldArray({
    control: form.control,
    name: 'tiers',
  })

  const submit = form.handleSubmit((values) => {
    form.clearErrors(['campaignKey', 'start'])
    const key = values.campaignKey.trim()
    if (
      props.otherPeriods.some((period) => period.campaignKey.trim() === key)
    ) {
      form.setError('campaignKey', {
        type: 'manual',
        message: t('Campaign keys must be unique across periods'),
      })
      return
    }
    if (
      props.otherPeriods.some((period) =>
        campaignPeriodsOverlap(values, period)
      )
    ) {
      form.setError('start', {
        type: 'manual',
        message: t('Campaign periods cannot overlap'),
      })
      return
    }
    void props.onSubmit(values)
  })

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !props.isSaving) props.onClose()
      }}
      title={props.title}
      description={t(
        'Each campaign has its own dates, tiers, and optional bonus day.'
      )}
      contentHeight='min(68vh, 720px)'
      showCloseButton={!props.isSaving}
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={props.onClose}
            disabled={props.isSaving}
          >
            {t('Cancel')}
          </Button>
          <Button
            type='submit'
            form='topup-campaign-period-form'
            disabled={props.isSaving}
          >
            {t('Save campaign')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='topup-campaign-period-form'
          className='space-y-6'
          onSubmit={submit}
        >
          <div className='grid gap-5 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='campaignKey'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Campaign key')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Groups this period’s user progress. Use a new key for a new period.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dayBonusRatePercent'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Day bonus rate (%)')}</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      max={100}
                      step={0.1}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Extra bonus on every top-up inside the bonus day window. 0 disables it.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='start'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Campaign start (UTC+8)')}</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' step={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='end'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Campaign end (UTC+8)')}</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' step={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dayStart'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Bonus day start (UTC+8)')}</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' step={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dayEnd'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Bonus day end (UTC+8)')}</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' step={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='whitelistUserIds'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Whitelist user IDs')}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder={t('For example: 1001, 1002, 1003')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Only these user IDs can see and participate in this campaign. Leave empty to allow everyone.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='space-y-3'>
            <div>
              <h4 className='text-sm font-medium'>
                {t('Cumulative top-up tiers')}
              </h4>
              <p className='text-muted-foreground text-xs'>
                {t('Tiers must be ordered by minimum amount.')}
              </p>
            </div>

            {tiers.fields.map((tierField, tierIndex) => (
              <div
                key={tierField.id}
                className='flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start'
              >
                <FormField
                  control={form.control}
                  name={`tiers.${tierIndex}.min_amount`}
                  render={({ field: minField }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>{t('Minimum top-up (USD)')}</FormLabel>
                      <FormControl>
                        <Input type='number' min={0} step={1} {...minField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`tiers.${tierIndex}.bonus_amount`}
                  render={({ field: bonusField }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>{t('Bonus credit (USD)')}</FormLabel>
                      <FormControl>
                        <Input type='number' min={0} step={1} {...bonusField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='mt-6 shrink-0'
                  aria-label={t('Remove')}
                  onClick={() => tiers.remove(tierIndex)}
                  disabled={tiers.fields.length <= 1}
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            ))}

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => tiers.append({ min_amount: 0, bonus_amount: 0 })}
              disabled={tiers.fields.length >= MAX_TOPUP_CAMPAIGN_TIERS}
            >
              <Plus className='size-4' />
              {t('Add tier')}
            </Button>

            <FormField
              control={form.control}
              name='tiers'
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </Dialog>
  )
}
