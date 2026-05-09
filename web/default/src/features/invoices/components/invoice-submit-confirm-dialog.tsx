import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { INVOICE_CONFIRM_PHRASE, formatInvoiceMoney } from '../lib/format'
import type { InvoiceType } from '../types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  tradeNos: string[]
  amount: number
  currency?: string
  invoiceType: InvoiceType
  title: string
  isLoading?: boolean
  onConfirm: () => void
}

export function InvoiceSubmitConfirmDialog({
  open,
  onOpenChange,
  selectedCount,
  tradeNos,
  amount,
  currency = 'USD',
  invoiceType,
  title,
  isLoading,
  onConfirm,
}: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const matched = value === INVOICE_CONFIRM_PHRASE

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setValue('')
      }}
      title={t('Confirm invoice issuance')}
      desc={
        <div className='space-y-2 text-sm'>
          <div>
            {t('Selected orders')}: {selectedCount}
          </div>
          <div className='break-all'>
            {t('Order numbers')}: {tradeNos.slice(0, 5).join(', ')}
          </div>
          <div>
            {t('Invoice title')}: {title}
          </div>
          <div>
            {t('Invoice type')}:{' '}
            {t(invoiceType === 'company' ? 'Company invoice' : 'Personal invoice')}
          </div>
          <div>
            {t('Invoice amount')}: {formatInvoiceMoney(amount, currency)}
          </div>
          <div className='text-muted-foreground text-xs'>
            {t('Type the confirmation phrase to continue')}: {INVOICE_CONFIRM_PHRASE}
          </div>
        </div>
      }
      confirmText={t('Submit invoice request')}
      disabled={!matched}
      isLoading={isLoading}
      handleConfirm={onConfirm}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={INVOICE_CONFIRM_PHRASE}
        autoComplete='off'
      />
    </ConfirmDialog>
  )
}
