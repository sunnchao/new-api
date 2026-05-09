import { useTranslation } from 'react-i18next'
import { TableEmpty } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatInvoiceMoney,
  formatUnixTime,
  getInvoiceStatusLabelKey,
  getInvoiceStatusVariant,
  getInvoiceTypeLabelKey,
} from '../lib/format'
import type { InvoiceRequestRecord } from '../types'

type Props = {
  items: InvoiceRequestRecord[]
  onCancel?: (invoiceId: number) => void
  cancellingId?: number | null
}

export function InvoiceRecordsTable({ items, onCancel, cancellingId }: Props) {
  const { t } = useTranslation()

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-20'>ID</TableHead>
            <TableHead>{t('Invoice type')}</TableHead>
            <TableHead>{t('Invoice title')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Created at')}</TableHead>
            <TableHead className='text-right'>{t('Amount')}</TableHead>
            <TableHead className='text-right'>{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableEmpty
              colSpan={7}
              title={t('No invoice requests')}
              description={t('Submitted invoice requests will appear here.')}
            />
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-mono text-xs'>{item.id}</TableCell>
                <TableCell>{t(getInvoiceTypeLabelKey(item.invoice_type))}</TableCell>
                <TableCell className='max-w-[240px] truncate'>
                  {item.title}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    copyable={false}
                    variant={getInvoiceStatusVariant(item.status)}
                    label={t(getInvoiceStatusLabelKey(item.status))}
                  />
                </TableCell>
                <TableCell className='text-muted-foreground font-mono text-xs'>
                  {formatUnixTime(item.created_at)}
                </TableCell>
                <TableCell className='text-right font-medium'>
                  {formatInvoiceMoney(item.amount, item.currency)}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end'>
                    {item.status === 'pending' && onCancel != null && (
                      <button
                        type='button'
                        className='text-muted-foreground hover:text-foreground text-xs'
                        onClick={() => onCancel(item.id)}
                        disabled={cancellingId === item.id}
                      >
                        {cancellingId === item.id
                          ? t('Cancelling...')
                          : t('Cancel')}
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
