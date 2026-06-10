"use client";

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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type RiskAcknowledgementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  items?: string[]
  requiredText?: string
  inputPrompt?: string
  inputPlaceholder?: string
  mismatchHint?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  className?: string
}

export function RiskAcknowledgementDialog({
  open,
  onOpenChange,
  title,
  description,
  items = [],
  requiredText = '',
  inputPrompt,
  inputPlaceholder,
  mismatchHint,
  confirmText,
  cancelText,
  destructive = true,
  isLoading = false,
  onConfirm,
  className,
}: RiskAcknowledgementDialogProps) {
  const { t } = useTranslation()
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    if (open) setTypedText('')
  }, [open])

  const typedMatched = useMemo(() => {
    if (!requiredText) return true
    return typedText.trim() === requiredText.trim()
  }, [requiredText, typedText])

  const hasTypedRequiredText = typedText.length > 0
  const inputLabel = inputPrompt ?? t('Please type the following text to confirm:')
  const canConfirm = typedMatched && !isLoading

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          'flex max-h-[min(88dvh,760px)] w-[calc(100vw-1.5rem)] !max-w-[44rem] grid-rows-none flex-col gap-0 overflow-hidden !p-0 sm:w-[min(44rem,calc(100vw-3rem))]',
          className
        )}
      >
        <AlertDialogHeader className='shrink-0 px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-6'>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription
              render={<div />}
              className='mt-1 text-left leading-5'
            >
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:px-6'>
          {items.length > 0 ? (
            <ol className='border-border/70 bg-muted/30 text-foreground list-decimal space-y-2 rounded-lg border px-4 py-3 pl-8 text-sm leading-6 sm:px-5 sm:py-4 sm:pl-9'>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : null}

          {requiredText ? (
            <div className='border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-3 sm:p-4'>
              <Label htmlFor='risk-acknowledgement-text' className='text-sm font-medium'>
                {inputLabel}
              </Label>
              <div className='bg-background border-border rounded-md border px-3 py-2 font-mono text-sm break-all'>
                {requiredText}
              </div>
              <Input
                id='risk-acknowledgement-text'
                aria-label={inputLabel}
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                placeholder={inputPlaceholder ?? t('Type the confirmation text here')}
                autoFocus={open}
                onCopy={(event) => event.preventDefault()}
                onCut={(event) => event.preventDefault()}
                onPaste={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                aria-invalid={hasTypedRequiredText && !typedMatched}
              />
              {hasTypedRequiredText && !typedMatched ? (
                <p className='text-destructive text-xs'>
                  {mismatchHint ?? t('The entered text does not match the required text.')}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <AlertDialogFooter className='mx-0 mb-0 shrink-0 rounded-b-xl border-t p-3 sm:p-4'>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText ?? t('Cancel')}
          </AlertDialogCancel>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmText ?? t('Confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
