import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { copyToClipboard as copyToClipboardUtil } from '@/lib/copy-to-clipboard'

type UseCopyToClipboardOptions = {
  notify?: boolean
  successMessage?: string
  errorMessage?: string
  resetAfterMs?: number
}

export function useCopyToClipboard(options?: UseCopyToClipboardOptions) {
  const {
    notify = true,
    successMessage,
    errorMessage,
    resetAfterMs = 2000,
  } = options || {}
  const { t } = useTranslation()

  const [copiedText, setCopiedText] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      const resolvedSuccessMessage = successMessage ?? t('Copied to clipboard')
      const resolvedErrorMessage = errorMessage ?? t('Failed to copy to clipboard')
      const success = await copyToClipboardUtil(text)

      if (success) {
        setCopiedText(text)
        if (notify) {
          toast.success(resolvedSuccessMessage)
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setCopiedText(null)
        }, resetAfterMs)
        return true
      } else {
        console.warn('All copy methods failed')
        if (notify) {
          toast.error(resolvedErrorMessage)
        }
        setCopiedText(null)
        return false
      }
    },
    [notify, successMessage, errorMessage, resetAfterMs, t]
  )

  return { copiedText, copyToClipboard }
}
