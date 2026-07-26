import { useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ERROR_MESSAGES } from '@/features/keys/constants'
import { batchDeleteAdminTokens } from '../api'
import type { AdminToken } from '../types'
import { useAdminTokens } from './admin-tokens-provider'

type AdminTokenMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function AdminTokenMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: AdminTokenMultiDeleteDialogProps<TData>) {
  const { t } = useTranslation()
  const { triggerRefresh } = useAdminTokens()
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      const ids = selectedRows.map((row) => (row.original as AdminToken).id)
      const result = await batchDeleteAdminTokens(ids)

      if (result.success) {
        const count = result.data || ids.length
        toast.success(t('Successfully deleted {{count}} API key(s)', { count }))
        table.resetRowSelection()
        triggerRefresh()
        onOpenChange(false)
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.BATCH_DELETE_FAILED))
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ConfirmDialog
      destructive
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleConfirm}
      isLoading={isDeleting}
      className='max-w-md'
      title={t('Delete {{count}} API key(s)?', { count: selectedRows.length })}
      desc={
        <>
          {t('You are about to delete {{count}} API key(s).', {
            count: selectedRows.length,
          })}{' '}
          <br />
          {t('This action cannot be undone.')}
        </>
      }
      confirmText={t('Delete')}
    />
  )
}
