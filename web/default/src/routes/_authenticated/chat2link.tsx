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
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChatTokenPickerDialog } from '@/features/chat/components/chat-token-picker-dialog'
import {
  useChatTokenKey,
  useEnabledChatTokens,
} from '@/features/chat/hooks/use-active-chat-key'
import { useChatPresets } from '@/features/chat/hooks/use-chat-presets'
import {
  chatLinkRequiresApiKey,
  resolveChatUrl,
} from '@/features/chat/lib/chat-links'

export const Route = createFileRoute('/_authenticated/chat2link')({
  component: Chat2LinkPage,
})

function Chat2LinkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { chatPresets, serverAddress } = useChatPresets()

  const firstWebPreset = useMemo(
    () => chatPresets.find((p) => p.type === 'web'),
    [chatPresets]
  )

  const needsToken = useMemo(
    () =>
      Boolean(firstWebPreset && chatLinkRequiresApiKey(firstWebPreset.url)),
    [firstWebPreset]
  )

  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const presetKey = firstWebPreset?.id ?? null
  const [resetKey, setResetKey] = useState<string | null>(null)
  const nextResetKey = needsToken ? presetKey : null

  if (resetKey !== nextResetKey) {
    setResetKey(nextResetKey)
    setSelectedTokenId(null)
    setCancelled(false)
    setPickerOpen(Boolean(nextResetKey))
  }

  const {
    data: tokens = [],
    isLoading: tokensLoading,
    error: tokensError,
  } = useEnabledChatTokens(needsToken && pickerOpen)

  const {
    data: activeKey,
    error: keyError,
  } = useChatTokenKey(needsToken ? selectedTokenId : null)

  useEffect(() => {
    if (!firstWebPreset) {
      if (chatPresets.length > 0) {
        toast.error(t('No available Web chat links'))
      }
      return
    }

    if (needsToken) {
      if (selectedTokenId == null) return
      if (activeKey === undefined && !keyError) return
      if (keyError || !activeKey) {
        const message =
          keyError instanceof Error
            ? keyError.message
            : t('No enabled tokens available')
        toast.error(message)
        navigate({ to: '/keys' })
        return
      }
    }

    const url = resolveChatUrl({
      template: firstWebPreset.url,
      apiKey: needsToken ? activeKey : undefined,
      serverAddress,
    })

    if (url) {
      window.location.href = url
    }
  }, [
    firstWebPreset,
    needsToken,
    selectedTokenId,
    activeKey,
    keyError,
    serverAddress,
    chatPresets.length,
    navigate,
    t,
  ])

  const picker = (
    <ChatTokenPickerDialog
      open={pickerOpen}
      onOpenChange={(open) => {
        setPickerOpen(open)
        if (!open && selectedTokenId == null) {
          setCancelled(true)
        }
      }}
      tokens={tokens}
      isLoading={tokensLoading}
      error={tokensError as Error | null}
      onSelect={(tokenId) => {
        setSelectedTokenId(tokenId)
        setPickerOpen(false)
        setCancelled(false)
      }}
    />
  )

  if (needsToken && cancelled && selectedTokenId == null) {
    return (
      <>
        {picker}
        <div className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            {t('You cancelled token selection.')}
          </p>
          <Button
            onClick={() => {
              setCancelled(false)
              setPickerOpen(true)
            }}
          >
            {t('Select token again')}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      {picker}
      <div className='flex h-full flex-col items-center justify-center gap-3'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>
          {t('Redirecting to chat page...')}
        </p>
      </div>
    </>
  )
}
