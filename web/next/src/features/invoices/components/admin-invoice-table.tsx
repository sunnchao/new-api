import { Check, FileCheck2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TableEmpty } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
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
import { AdminInvoiceDialogs, type AdminInvoiceDialog } from './admin-invoice-dialogs'
import type { AdminIssueInvoicePayload, InvoiceRequestRecord } from '../types'

type Props = {
  items: InvoiceRequestRecord[]
  dialog: AdminInvoiceDialog
  onDialogChange: (dialog: AdminInvoiceDialog) => void
  onApprove: (invoiceId: number) => Promise<void>
  onReject: (invoiceId: number, reason: string) => Promise<void>
  onIssue: (invoiceId: number, payload: AdminIssueInvoicePayload) => Promise<void>
  isLoading?: boolean
}

export function AdminInvoiceTable({
  items,
  dialog,
  onDialogChange,
  onApprove,
  onReject,
  onIssue,
  isLoading,
}: Props) {
  const { t } = useTranslation()

  return (
    <>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-20'>ID</TableHead>
              <TableHead>{t('User')}</TableHead>
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
                colSpan={8}
                title={t('No invoice requests')}
                description={t(
                  'Invoice requests awaiting review will appear here.'
                )}
              />
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-mono text-xs'>{item.id}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>
                    {t(getInvoiceTypeLabelKey(item.invoice_type))}
                  </TableCell>
                  <TableCell className='max-w-[220px] truncate'>
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
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='outline'
                        size='icon-sm'
                        disabled={item.status !== 'pending' || isLoading}
                        onClick={() =>
                          onDialogChange({ type: 'approve', invoiceId: item.id })
                        }
                        title={t('Approve')}
                      >
                        <Check className='size-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='icon-sm'
                        disabled={item.status !== 'pending' || isLoading}
                        onClick={() =>
                          onDialogChange({ type: 'reject', invoiceId: item.id })
                        }
                        title={t('Reject')}
                      >
                        <X className='size-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='icon-sm'
                        disabled={item.status !== 'approved' || isLoading}
                        onClick={() =>
                          onDialogChange({ type: 'issue', invoiceId: item.id })
                        }
                        title={t('Mark as issued')}
                      >
                        <FileCheck2 className='size-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AdminInvoiceDialogs
        dialog={dialog}
        onOpenChange={onDialogChange}
        onApprove={onApprove}
        onReject={onReject}
        onIssue={onIssue}
        isLoading={isLoading}
      />
    </>
  )
}
