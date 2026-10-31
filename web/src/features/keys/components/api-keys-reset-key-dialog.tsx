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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { CopyButton } from '@/components/copy-button'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { handleServerError } from '@/lib/handle-server-error'

import { resetApiKeyKey } from '../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import { useApiKeys } from './api-keys-provider'

export function ApiKeysResetKeyDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh, rememberResolvedKey } =
    useApiKeys()
  const [isResetting, setIsResetting] = useState(false)
  const [newKey, setNewKey] = useState('')

  const handleConfirm = async () => {
    if (!currentRow) return

    setIsResetting(true)
    try {
      const result = await resetApiKeyKey(currentRow.id)
      if (result.success && result.data?.key) {
        const fullKey = `sk-${result.data.key}`
        setNewKey(fullKey)
        rememberResolvedKey(currentRow.id, fullKey)
        triggerRefresh()
        toast.success(t(SUCCESS_MESSAGES.API_KEY_RESET))
      } else {
        handleServerError(result, t(ERROR_MESSAGES.RESET_FAILED))
      }
    } catch (error) {
      handleServerError(error, t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsResetting(false)
    }
  }

  const handleClose = () => {
    setOpen(null)
    setNewKey('')
  }

  if (newKey) {
    return (
      <Dialog
        open={open === 'reset-key'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        title={t('New API key')}
        description={t(
          'The previous key stopped working. Update every client that uses this API key.'
        )}
        contentClassName='sm:max-w-md'
        contentHeight='auto'
        footer={<Button onClick={handleClose}>{t('Done')}</Button>}
      >
        <div className='flex items-center gap-2'>
          <Input
            readOnly
            value={newKey}
            aria-label={t('New API key')}
            className='font-mono'
          />
          <CopyButton
            value={newKey}
            variant='outline'
            aria-label={t('Copy Key')}
          />
        </div>
      </Dialog>
    )
  }

  return (
    <ConfirmDialog
      open={open === 'reset-key'}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      title={t('Reset API key?')}
      desc={
        <>
          {t(
            'The current key stops working immediately. Any client still using it will fail until you update it.'
          )}{' '}
          <span className='font-semibold'>{currentRow?.name}</span>
        </>
      }
      confirmText={t('Reset Key')}
      destructive
      isLoading={isResetting}
      handleConfirm={handleConfirm}
    />
  )
}
