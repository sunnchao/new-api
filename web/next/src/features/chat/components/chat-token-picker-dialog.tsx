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
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GroupBadge } from '@/components/group-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ApiKey } from '@/features/keys/types'

function parseGroupList(value?: string | null): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export type ChatTokenPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokens: ApiKey[]
  isLoading?: boolean
  error?: Error | null
  onSelect: (tokenId: number) => void
}

export function ChatTokenPickerDialog({
  open,
  onOpenChange,
  tokens,
  isLoading,
  error,
  onSelect,
}: ChatTokenPickerDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('Select token')}</DialogTitle>
          <DialogDescription>
            {t('Choose an enabled token to start the chat session.')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : error ? (
          <div className='text-destructive py-6 text-center text-sm'>
            {error.message}
          </div>
        ) : tokens.length === 0 ? (
          <div className='text-muted-foreground py-6 text-center text-sm'>
            {t(
              'No enabled tokens available. Please create or enable a token first.'
            )}
          </div>
        ) : (
          <ScrollArea className='max-h-[60vh]'>
            <ul className='flex flex-col gap-2 pr-2'>
              {tokens.map((token) => {
                const backupGroups = parseGroupList(token.backup_group)
                const displayName =
                  token.name || `sk-${token.key.substring(0, 8)}...`

                return (
                  <li key={token.id}>
                    <button
                      type='button'
                      onClick={() => onSelect(token.id)}
                      className={cn(
                        'border-border bg-background hover:border-primary hover:bg-muted/40 flex w-full flex-col gap-2 rounded-md border p-3 text-left transition-all',
                        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2'
                      )}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span className='truncate text-sm font-medium'>
                          {displayName}
                        </span>
                      </div>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <span className='text-muted-foreground text-xs'>
                          {t('Group')}
                        </span>
                        <GroupBadge group={token.group || ''} />
                        {backupGroups.map((group) => (
                          <GroupBadge key={group} group={group} />
                        ))}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
