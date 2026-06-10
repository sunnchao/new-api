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
import { useEffect, useState } from 'react'
import { Loader2, QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { bindWeChat } from '../../api'

// ============================================================================
// WeChat Bind Dialog Component
// ============================================================================

interface WeChatBindDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrCodeUrl?: string
  onSuccess: () => void
}

export function WeChatBindDialog({
  open,
  onOpenChange,
  qrCodeUrl,
  onSuccess,
}: WeChatBindDialogProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const trimmedCode = code.trim()

  useEffect(() => {
    if (!open) {
      setCode('')
      setLoading(false)
    }
  }, [open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!loading) {
      onOpenChange(nextOpen)
    }
  }

  const handleBind = async () => {
    if (!trimmedCode) {
      toast.error(t('Verification code is required'))
      return
    }

    setLoading(true)
    try {
      const response = await bindWeChat(trimmedCode)
      if (response.success) {
        toast.success(response.message || t('WeChat account bound'))
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(response.message || t('WeChat binding failed'))
      }
    } catch {
      toast.error(t('WeChat binding failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('Bind WeChat Account')}</DialogTitle>
          <DialogDescription>
            {t('Scan the QR code with WeChat to bind your account')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <Alert>
            <QrCode className='h-4 w-4' />
            <AlertDescription>
              {t(
                'Scan the QR code with WeChat, follow the official account, then enter "verification code" to receive a code valid for 3 minutes.'
              )}
            </AlertDescription>
          </Alert>

          <div className='flex justify-center'>
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={t('WeChat QR code')}
                className='h-40 w-40 rounded-md border object-contain p-2'
              />
            ) : (
              <div className='flex h-40 w-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center'>
                <QrCode className='text-muted-foreground mb-3 h-10 w-10' />
                <p className='text-muted-foreground text-sm'>
                  {t('WeChat QR code is not configured')}
                </p>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='wechat-verification-code'>
              {t('Verification Code')}
            </Label>
            <Input
              id='wechat-verification-code'
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('Enter the WeChat verification code')}
              autoComplete='one-time-code'
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t('Cancel')}
          </Button>
          <Button
            type='button'
            onClick={handleBind}
            disabled={loading || !trimmedCode}
            className='gap-2'
          >
            {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
            {loading ? t('Binding...') : t('Bind WeChat')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
