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
import { useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { SettingsForm } from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import {
  giftQuotaExpirationPolicySchema,
  parseExpirationPolicy,
  PERMANENT_GIFT_QUOTA_EXPIRATION,
  serializeExpirationPolicy,
  type GiftQuotaExpirationPolicy,
} from './gift-quota-expiration'

const schema = z.object({
  checkin: giftQuotaExpirationPolicySchema,
  topupBonus: giftQuotaExpirationPolicySchema,
})

type Values = z.infer<typeof schema>

function PolicyEditor(props: {
  id: string
  title: string
  value: GiftQuotaExpirationPolicy
  durationDefault: Pick<GiftQuotaExpirationPolicy, 'unit' | 'value'>
  onChange: (value: GiftQuotaExpirationPolicy) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const modeLabelId = `${props.id}-mode-label`
  const durationId = `${props.id}-duration`

  return (
    <FieldSet>
      <FieldLegend>{props.title}</FieldLegend>
      <FieldGroup>
        <Field orientation='responsive'>
          <FieldTitle id={modeLabelId}>{t('Expiration policy')}</FieldTitle>
          <ToggleGroup
            value={[props.value.mode]}
            onValueChange={(values) => {
              const nextMode = values.find(
                (value) => value !== props.value.mode
              ) as GiftQuotaExpirationPolicy['mode'] | undefined
              if (!nextMode) return
              if (nextMode === 'permanent') {
                props.onChange(PERMANENT_GIFT_QUOTA_EXPIRATION)
                return
              }
              props.onChange({
                mode: 'duration',
                unit: props.durationDefault.unit,
                value: props.durationDefault.value,
              })
            }}
            aria-labelledby={modeLabelId}
            variant='outline'
            spacing={0}
            disabled={props.disabled}
          >
            <ToggleGroupItem value='permanent'>
              {t('Permanent')}
            </ToggleGroupItem>
            <ToggleGroupItem value='duration'>
              {t('Fixed duration')}
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {props.value.mode === 'duration' ? (
          <Field orientation='responsive'>
            <FieldLabel htmlFor={durationId}>{t('Validity period')}</FieldLabel>
            <div className='grid w-full grid-cols-[minmax(7rem,1fr)_auto] gap-2 sm:w-auto'>
              <Input
                id={durationId}
                type='number'
                min={1}
                max={props.value.unit === 'day' ? 3650 : 120}
                value={props.value.value}
                onChange={(event) =>
                  props.onChange({
                    ...props.value,
                    value: Number(event.target.value),
                  })
                }
                disabled={props.disabled}
              />
              <ToggleGroup
                value={[props.value.unit]}
                onValueChange={(values) => {
                  const nextUnit = values.find(
                    (value) => value !== props.value.unit
                  ) as GiftQuotaExpirationPolicy['unit'] | undefined
                  if (nextUnit) {
                    props.onChange({ ...props.value, unit: nextUnit })
                  }
                }}
                aria-label={t('Validity period')}
                variant='outline'
                spacing={0}
                disabled={props.disabled}
              >
                <ToggleGroupItem value='day'>{t('Days')}</ToggleGroupItem>
                <ToggleGroupItem value='month'>{t('Months')}</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </Field>
        ) : null}
      </FieldGroup>
    </FieldSet>
  )
}

export function GiftQuotaExpirationSection(props: {
  checkin: string
  topupBonus: string
}) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const initialCheckin = parseExpirationPolicy(props.checkin)
  const initialTopupBonus = parseExpirationPolicy(props.topupBonus)
  const form = useForm<Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Values>,
    defaultValues: {
      checkin: initialCheckin,
      topupBonus: initialTopupBonus,
    },
  })
  const disabled = updateOption.isPending || form.formState.isSubmitting

  async function onSubmit(values: Values) {
    const updates: Array<{ key: string; value: string }> = []
    const checkin = serializeExpirationPolicy(values.checkin)
    const topupBonus = serializeExpirationPolicy(values.topupBonus)
    if (checkin !== serializeExpirationPolicy(initialCheckin)) {
      updates.push({
        key: 'gift_quota_expiration_setting.checkin',
        value: checkin,
      })
    }
    if (topupBonus !== serializeExpirationPolicy(initialTopupBonus)) {
      updates.push({
        key: 'gift_quota_expiration_setting.topup_bonus',
        value: topupBonus,
      })
    }
    if (updates.length === 0) {
      toast.info(t('No changes to save'))
      return
    }
    for (const update of updates) {
      await updateOption.mutateAsync(update)
    }
    form.reset(values)
  }

  return (
    <SettingsSection title={t('Gift Quota Expiration')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={disabled}
            isSaveDisabled={!form.formState.isDirty}
          />
          <FormField
            control={form.control}
            name='checkin'
            render={({ field }) => (
              <FormItem>
                <PolicyEditor
                  id='checkin-gift-expiration'
                  title={t('Check-in gift quota expiration')}
                  value={field.value}
                  durationDefault={{ unit: 'day', value: 7 }}
                  onChange={field.onChange}
                  disabled={disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <FormField
            control={form.control}
            name='topupBonus'
            render={({ field }) => (
              <FormItem>
                <PolicyEditor
                  id='topup-gift-expiration'
                  title={t('Top-up bonus quota expiration')}
                  value={field.value}
                  durationDefault={{ unit: 'month', value: 1 }}
                  onChange={field.onChange}
                  disabled={disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
