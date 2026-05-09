import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InvoiceProfile, InvoiceType } from '../types'

type Props = {
  type: InvoiceType
  profile?: InvoiceProfile | null
  isLoading?: boolean
  onSave: (profile: InvoiceProfile) => Promise<void>
}

const emptyProfile = (type: InvoiceType): InvoiceProfile => ({
  invoice_type: type,
  title: '',
  tax_no: '',
  email: '',
  phone: '',
  bank_name: '',
  bank_account: '',
  registered_address: '',
  registered_phone: '',
})

export function InvoiceProfilePanel({
  type,
  profile,
  isLoading,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const form = useForm<InvoiceProfile>({ defaultValues: emptyProfile(type) })

  useEffect(() => {
    form.reset({ ...emptyProfile(type), ...(profile ?? {}) })
  }, [form, profile, type])

  return (
    <Card className='rounded-lg'>
      <CardHeader>
        <CardTitle>
          {t(type === 'company' ? 'Company invoice' : 'Personal invoice')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className='grid gap-3 md:grid-cols-2'
          onSubmit={form.handleSubmit((values) =>
            onSave({ ...values, invoice_type: type })
          )}
        >
          <div className='space-y-1.5'>
            <Label>{t('Invoice title')}</Label>
            <Input {...form.register('title')} />
          </div>
          <div className='space-y-1.5'>
            <Label>{t('Email')}</Label>
            <Input {...form.register('email')} />
          </div>
          {type === 'company' && (
            <div className='space-y-1.5'>
              <Label>{t('Tax number')}</Label>
              <Input {...form.register('tax_no')} />
            </div>
          )}
          <div className='space-y-1.5'>
            <Label>{t('Phone')}</Label>
            <Input {...form.register('phone')} />
          </div>
          {type === 'company' && (
            <>
              <div className='space-y-1.5'>
                <Label>{t('Bank name')}</Label>
                <Input {...form.register('bank_name')} />
              </div>
              <div className='space-y-1.5'>
                <Label>{t('Bank account')}</Label>
                <Input {...form.register('bank_account')} />
              </div>
              <div className='space-y-1.5'>
                <Label>{t('Registered address')}</Label>
                <Input {...form.register('registered_address')} />
              </div>
              <div className='space-y-1.5'>
                <Label>{t('Registered phone')}</Label>
                <Input {...form.register('registered_phone')} />
              </div>
            </>
          )}
          <div className='md:col-span-2'>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? t('Saving...') : t('Save invoice profile')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
