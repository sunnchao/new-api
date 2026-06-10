"use client";

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
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
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
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from '../components/settings-section'
import { useResetForm } from '../hooks/use-reset-form'
import { useUpdateOption } from '../hooks/use-update-option'

const behaviorSchema = z.object({
  RetryTimes: z.coerce.number().min(0).max(10),
  DefaultCollapseSidebar: z.boolean(),
  DemoSiteEnabled: z.boolean(),
  SelfUseModeEnabled: z.boolean(),
  token_setting: z.object({
    max_user_tokens: z.coerce.number().int().min(1),
  }),
})

type BehaviorFormValues = z.infer<typeof behaviorSchema>

type FlatBehaviorDefaults = {
  RetryTimes: number
  DefaultCollapseSidebar: boolean
  DemoSiteEnabled: boolean
  SelfUseModeEnabled: boolean
  'token_setting.max_user_tokens': number
}

type SystemBehaviorSectionProps = {
  defaultValues: FlatBehaviorDefaults
}

const buildFormDefaults = (
  defaults: FlatBehaviorDefaults
): BehaviorFormValues => ({
  RetryTimes: defaults.RetryTimes,
  DefaultCollapseSidebar: defaults.DefaultCollapseSidebar,
  DemoSiteEnabled: defaults.DemoSiteEnabled,
  SelfUseModeEnabled: defaults.SelfUseModeEnabled,
  token_setting: {
    max_user_tokens: defaults['token_setting.max_user_tokens'],
  },
})

const normalizeFormValues = (
  values: BehaviorFormValues
): FlatBehaviorDefaults => ({
  RetryTimes: values.RetryTimes,
  DefaultCollapseSidebar: values.DefaultCollapseSidebar,
  DemoSiteEnabled: values.DemoSiteEnabled,
  SelfUseModeEnabled: values.SelfUseModeEnabled,
  'token_setting.max_user_tokens': values.token_setting.max_user_tokens,
})

export function SystemBehaviorSection({
  defaultValues,
}: SystemBehaviorSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const formDefaults = buildFormDefaults(defaultValues)

  const form = useForm<BehaviorFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(behaviorSchema) as any,
    defaultValues: formDefaults,
  })

  useResetForm(form, formDefaults)

  const onSubmit = async (data: BehaviorFormValues) => {
    const normalized = normalizeFormValues(data)
    const updates = Object.entries(normalized).filter(
      ([key, value]) =>
        value !== defaultValues[key as keyof FlatBehaviorDefaults]
    )

    for (const [key, value] of updates) {
      await updateOption.mutateAsync({ key, value })
    }
  }

  return (
    <SettingsSection
      title={t('System Behavior')}
      description={t('Configure system-wide behavior and defaults')}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='RetryTimes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Retry Times')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min='0'
                    max='10'
                    value={field.value as number}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  {t('Number of times to retry failed requests (0-10)')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='DefaultCollapseSidebar'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    {t('Default Collapse Sidebar')}
                  </FormLabel>
                  <FormDescription>
                    {t('Sidebar collapsed by default for new users')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='DemoSiteEnabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    {t('Demo Site Mode')}
                  </FormLabel>
                  <FormDescription>
                    {t('Enable demo mode with limited functionality')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='SelfUseModeEnabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    {t('Self-Use Mode')}
                  </FormLabel>
                  <FormDescription>
                    {t('Optimize system for self-hosted single-user usage')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='token_setting.max_user_tokens'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Maximum Tokens per User')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min='1'
                    step='1'
                    value={field.value as number}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Maximum number of API keys each user can create. Default is 1000; very large values may affect performance.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={updateOption.isPending}>
            {updateOption.isPending ? t('Saving...') : t('Save Changes')}
          </Button>
        </form>
      </Form>
    </SettingsSection>
  )
}
