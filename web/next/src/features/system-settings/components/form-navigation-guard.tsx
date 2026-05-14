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
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'

type FormNavigationGuardProps = {
  when: boolean
  title?: string
  message?: string
}

/**
 * Form navigation guard with custom dialog
 *
 * Prevents navigation when form has unsaved changes.
 * Uses project's native ConfirmDialog instead of browser's window.confirm()
 *
 * In Next.js, this guards against:
 * - Browser navigation (refresh, close tab) via beforeunload
 * - Back/forward navigation via popstate
 * - Next.js client-side navigations via monkey-patched router.push/replace
 *
 * @param when - Whether to block navigation (typically form.formState.isDirty)
 * @param title - Dialog title
 * @param message - Dialog message
 *
 * @example
 * ```tsx
 * <FormNavigationGuard when={form.formState.isDirty} />
 * ```
 */
export function FormNavigationGuard({
  when,
  title,
  message,
}: FormNavigationGuardProps) {
  const { t } = useTranslation()
  const resolvedTitle = title ?? t('Unsaved changes')
  const resolvedMessage =
    message ?? t('You have unsaved changes. Are you sure you want to leave?')
  const [showDialog, setShowDialog] = useState(false)
  const pendingNavigationRef = useRef<(() => void) | null>(null)
  const whenRef = useRef(when)
  whenRef.current = when

  // Block browser navigation (refresh, close tab)
  useEffect(() => {
    if (!when) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [when])

  // Block back/forward navigation via popstate
  const handlePopState = useCallback(() => {
    if (whenRef.current) {
      window.history.pushState(null, '')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDialog(true)
    }
  }, [])

  useEffect(() => {
    if (!when) return

    window.history.pushState(null, '')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [when, handlePopState])

  const handleConfirm = () => {
    setShowDialog(false)
    pendingNavigationRef.current?.()
    pendingNavigationRef.current = null
  }

  const handleCancel = () => {
    setShowDialog(false)
    pendingNavigationRef.current = null
  }

  return (
    <ConfirmDialog
      open={showDialog}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
      title={resolvedTitle}
      desc={resolvedMessage}
      confirmText={t('Leave')}
      cancelBtnText={t('Stay')}
      destructive
      handleConfirm={handleConfirm}
    />
  )
}
