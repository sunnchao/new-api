import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AdminIssueInvoicePayload } from '../types'

export type AdminInvoiceDialog =
  | { type: 'approve'; invoiceId: number }
  | { type: 'reject'; invoiceId: number }
  | { type: 'issue'; invoiceId: number }
  | null

type Props = {
  dialog: AdminInvoiceDialog
  onOpenChange: (dialog: AdminInvoiceDialog) => void
  onApprove: (invoiceId: number) => Promise<void>
  onReject: (invoiceId: number, reason: string) => Promise<void>
  onIssue: (invoiceId: number, payload: AdminIssueInvoicePayload) => Promise<void>
  isLoading?: boolean
}

export function AdminInvoiceDialogs({
  dialog,
  onOpenChange,
  onApprove,
  onReject,
  onIssue,
  isLoading,
}: Props) {
  const { t } = useTranslation()
  const [rejectReason, setRejectReason] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [issueNote, setIssueNote] = useState('')

  const close = () => {
    onOpenChange(null)
    setRejectReason('')
    setInvoiceNo('')
    setInvoiceUrl('')
    setIssueNote('')
  }

  return (
    <>
      <ConfirmDialog
        open={dialog?.type === 'approve'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={t('Approve invoice request')}
        desc={t('Approve this pending invoice request.')}
        confirmText={t('Approve')}
        isLoading={isLoading}
        handleConfirm={async () => {
          if (dialog?.type !== 'approve') return
          await onApprove(dialog.invoiceId)
          close()
        }}
      />

      <ConfirmDialog
        open={dialog?.type === 'reject'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={t('Reject invoice request')}
        desc={t('Enter a rejection reason for this invoice request.')}
        confirmText={t('Reject')}
        destructive
        disabled={!rejectReason.trim()}
        isLoading={isLoading}
        handleConfirm={async () => {
          if (dialog?.type !== 'reject') return
          await onReject(dialog.invoiceId, rejectReason)
          close()
        }}
      >
        <Textarea
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder={t('Reject reason')}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog?.type === 'issue'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={t('Mark invoice as issued')}
        desc={t('Enter the issued invoice details.')}
        confirmText={t('Mark as issued')}
        disabled={!invoiceNo.trim()}
        isLoading={isLoading}
        handleConfirm={async () => {
          if (dialog?.type !== 'issue') return
          await onIssue(dialog.invoiceId, {
            invoice_no: invoiceNo.trim(),
            invoice_url: invoiceUrl.trim(),
            issue_note: issueNote.trim(),
          })
          close()
        }}
      >
        <div className='space-y-3'>
          <Input
            value={invoiceNo}
            onChange={(event) => setInvoiceNo(event.target.value)}
            placeholder={t('Invoice number')}
          />
          <Input
            value={invoiceUrl}
            onChange={(event) => setInvoiceUrl(event.target.value)}
            placeholder={t('Invoice URL')}
          />
          <Textarea
            value={issueNote}
            onChange={(event) => setIssueNote(event.target.value)}
            placeholder={t('Issue note')}
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
