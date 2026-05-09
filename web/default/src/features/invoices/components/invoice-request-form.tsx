import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatInvoiceMoney, sumSelectedTopUps } from '../lib/format'
import { InvoiceSubmitConfirmDialog } from './invoice-submit-confirm-dialog'
import type {
  CreateInvoicePayload,
  InvoiceProfile,
  InvoiceType,
  InvoiceableTopUp,
} from '../types'

type Props = {
  selectedTopUps: InvoiceableTopUp[]
  personalProfile?: InvoiceProfile | null
  companyProfile?: InvoiceProfile | null
  isLoading?: boolean
  onSubmit: (payload: CreateInvoicePayload) => Promise<void>
}

type FormValues = {
  invoice_type: InvoiceType
  title: string
  tax_no: string
  email: string
  phone: string
  remark: string
}

function profileValues(type: InvoiceType, profile?: InvoiceProfile | null) {
  return {
    invoice_type: type,
    title: profile?.title ?? '',
    tax_no: profile?.tax_no ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    remark: '',
  }
}

export function InvoiceRequestForm({
  selectedTopUps,
  personalProfile,
  companyProfile,
  isLoading,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const form = useForm<FormValues>({
    defaultValues: profileValues('personal', personalProfile),
  })
  const invoiceType = form.watch('invoice_type')
  const values = form.watch()
  const amount = useMemo(
    () => sumSelectedTopUps(selectedTopUps),
    [selectedTopUps]
  )

  useEffect(() => {
    const currentType = form.getValues('invoice_type')
    const profile = currentType === 'company' ? companyProfile : personalProfile
    form.reset({
      ...profileValues(currentType, profile),
      remark: form.getValues('remark'),
    })
  }, [companyProfile, form, personalProfile])

  const applyProfile = (type: InvoiceType) => {
    const profile = type === 'company' ? companyProfile : personalProfile
    form.reset(profileValues(type, profile))
  }

  const disabled =
    selectedTopUps.length === 0 ||
    !values.title.trim() ||
    (invoiceType === 'company' && !values.tax_no.trim())

  const submitPayload = async () => {
    await onSubmit({
      topup_ids: selectedTopUps.map((item) => item.id),
      invoice_type: values.invoice_type,
      title: values.title,
      tax_no: values.tax_no,
      email: values.email,
      phone: values.phone,
      remark: values.remark,
    })
    setConfirmOpen(false)
  }

  return (
    <Card className='rounded-lg'>
      <CardHeader>
        <CardTitle>{t('Invoice request')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/25 p-3'>
          <div>
            <div className='text-muted-foreground text-sm'>
              {t('Selected amount')}
            </div>
            <div className='text-xl font-semibold'>
              {formatInvoiceMoney(amount)}
            </div>
          </div>
          <div className='text-muted-foreground text-sm'>
            {t('Selected orders')}: {selectedTopUps.length}
          </div>
        </div>
        <form
          className='grid gap-3 md:grid-cols-2'
          onSubmit={(event) => {
            event.preventDefault()
            setConfirmOpen(true)
          }}
        >
          <div className='space-y-1.5'>
            <Label>{t('Invoice type')}</Label>
            <Select
              value={invoiceType}
              onValueChange={(value) => {
                if (value) applyProfile(value as InvoiceType)
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='personal'>{t('Personal invoice')}</SelectItem>
                <SelectItem value='company'>{t('Company invoice')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>{t('Invoice title')}</Label>
            <Input {...form.register('title')} />
          </div>
          {invoiceType === 'company' && (
            <div className='space-y-1.5'>
              <Label>{t('Tax number')}</Label>
              <Input {...form.register('tax_no')} />
            </div>
          )}
          <div className='space-y-1.5'>
            <Label>{t('Email')}</Label>
            <Input {...form.register('email')} />
          </div>
          <div className='space-y-1.5'>
            <Label>{t('Phone')}</Label>
            <Input {...form.register('phone')} />
          </div>
          <div className='space-y-1.5 md:col-span-2'>
            <Label>{t('Remark')}</Label>
            <Textarea {...form.register('remark')} />
          </div>
          <div className='md:col-span-2'>
            <Button type='submit' disabled={disabled || isLoading}>
              {t('Submit invoice request')}
            </Button>
          </div>
        </form>
        <InvoiceSubmitConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          selectedCount={selectedTopUps.length}
          tradeNos={selectedTopUps.map((item) => item.trade_no)}
          amount={amount}
          invoiceType={values.invoice_type}
          title={values.title}
          isLoading={isLoading}
          onConfirm={submitPayload}
        />
      </CardContent>
    </Card>
  )
}
