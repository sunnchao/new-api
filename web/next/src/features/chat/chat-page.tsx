"use client"

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
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, MessageCircleWarning } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

export default function ChatPage({ chatId }: { chatId: string }) {
  const { t } = useTranslation()
  const { chatPresets, serverAddress } = useChatPresets()

  const preset = useMemo(() => {
    const index = Number(chatId)
    if (!Number.isInteger(index)) return undefined
    return chatPresets[index]
  }, [chatId, chatPresets])

  const isWebLink = preset?.type === 'web'

  const requiresActiveKey = useMemo(() => {
    if (!preset || !isWebLink) return false
    return chatLinkRequiresApiKey(preset.url ?? '')
  }, [isWebLink, preset])

  const needsToken = Boolean(preset && requiresActiveKey)

  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(needsToken)
  const [cancelled, setCancelled] = useState(false)
  const [resetKey, setResetKey] = useState(`${chatId}:${needsToken}`)

  if (resetKey !== `${chatId}:${needsToken}`) {
    setResetKey(`${chatId}:${needsToken}`)
    setSelectedTokenId(null)
    setCancelled(false)
    setPickerOpen(needsToken)
  }

  const {
    data: tokens = [],
    isLoading: tokensLoading,
    error: tokensError,
  } = useEnabledChatTokens(needsToken && pickerOpen)

  const {
    data: activeKey,
    isPending: keyPending,
    isError: keyIsError,
    error: keyError,
  } = useChatTokenKey(needsToken ? selectedTokenId : null)

  const iframeSrc = useMemo(() => {
    if (!preset || !isWebLink) return ''
    if (needsToken && !activeKey) return ''
    return resolveChatUrl({
      template: preset.url,
      apiKey: needsToken ? activeKey : undefined,
      serverAddress,
    })
  }, [activeKey, isWebLink, needsToken, preset, serverAddress])

  if (!preset) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'>
        <MessageCircleWarning className='text-muted-foreground h-12 w-12' />
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold'>
            {t('Chat preset not found')}
          </h2>
          <p className='text-muted-foreground'>
            {t('The requested chat preset does not exist or has been removed.')}
          </p>
        </div>
        <Button variant='outline' render={<Link href='/dashboard' />}>
          {t('Return to dashboard')}
        </Button>
      </div>
    )
  }

  if (!isWebLink) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'>
        <MessageCircleWarning className='text-muted-foreground h-12 w-12' />
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold'>{t('Use sidebar shortcut')}</h2>
          <p className='text-muted-foreground'>
            {preset.name}{' '}
            {t(
              'opens in an external client. Trigger it from the sidebar or API key actions to launch the configured application.'
            )}
          </p>
        </div>
        <Button variant='outline' render={<Link href='/dashboard' />}>
          {t('Return to dashboard')}
        </Button>
      </div>
    )
  }

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

  if (needsToken && selectedTokenId == null) {
    return (
      <>
        {picker}
        <div className='flex h-full flex-col items-center justify-center gap-4'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm'>
            {t('Preparing your chat link…')}
          </p>
        </div>
      </>
    )
  }

  if (needsToken && keyPending) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>
          {t('Preparing your chat link…')}
        </p>
      </div>
    )
  }

  if (needsToken && (keyIsError || !activeKey || !iframeSrc)) {
    const message =
      keyError instanceof Error
        ? keyError.message
        : 'Unable to generate chat link. Please check your API keys.'

    return (
      <div className='flex h-full flex-col items-center justify-center gap-4 p-6'>
        <Alert variant='destructive' className='max-w-xl'>
          <AlertTitle>{t('Unable to open chat')}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button
          variant='outline'
          onClick={() => {
            setSelectedTokenId(null)
            setPickerOpen(true)
          }}
        >
          {t('Select token again')}
        </Button>
      </div>
    )
  }

  if (!needsToken && !iframeSrc) {
    return (
      <div className='flex h-full flex-col items-center justify-center p-6'>
        <Alert variant='destructive' className='max-w-xl'>
          <AlertTitle>{t('Unable to open chat')}</AlertTitle>
          <AlertDescription>
            {t(
              'Unable to generate chat link. Please contact your administrator.'
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <iframe
      src={iframeSrc}
      key={iframeSrc}
      className='h-full w-full border-0'
      allow='camera; microphone'
      title={`Chat preset: ${preset.name}`}
    />
  )
}
