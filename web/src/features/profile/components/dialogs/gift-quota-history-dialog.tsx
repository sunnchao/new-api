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
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  GiftIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatQuota, formatTimestampToDate } from '@/lib/format'

import { getGiftQuotaHistory } from '../../api'

const PAGE_SIZE = 10

interface GiftQuotaHistoryDialogProps {
  giftQuota: number
}

export function GiftQuotaHistoryDialog(props: GiftQuotaHistoryDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const historyQuery = useQuery({
    queryKey: ['profile', 'gift-quota-history', page, PAGE_SIZE],
    queryFn: async () => {
      const response = await getGiftQuotaHistory(page, PAGE_SIZE)
      if (!response.success || !response.data) {
        throw new Error(
          response.message || t('Failed to load gift quota history')
        )
      }
      return response.data
    },
    enabled: open,
    placeholderData: (previousData) => previousData,
  })

  const items = historyQuery.data?.items ?? []
  const totalPages = Math.max(
    1,
    Math.ceil((historyQuery.data?.total ?? 0) / PAGE_SIZE)
  )

  function getSourceLabel(source: string): string {
    if (source === 'checkin') return t('Check-in')
    if (source === 'topup_bonus') return t('Top-up bonus')
    return source
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) setPage(1)
  }

  let content
  if (historyQuery.isLoading) {
    content = (
      <div
        role='status'
        aria-label={t('Loading gift quota history')}
        className='grid min-h-64 gap-3 py-2'
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-12 w-full' />
        ))}
      </div>
    )
  } else if (historyQuery.isError) {
    content = (
      <Empty className='min-h-64'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{t('Failed to load gift quota history')}</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button variant='outline' onClick={() => historyQuery.refetch()}>
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              data-icon='inline-start'
            />
            {t('Retry')}
          </Button>
        </EmptyContent>
      </Empty>
    )
  } else if (items.length === 0) {
    content = (
      <Empty className='min-h-64'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <HugeiconsIcon icon={GiftIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{t('No gift quota history')}</EmptyTitle>
          <EmptyDescription>
            {t('Gift quota grants will appear here.')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  } else {
    content = (
      <Table aria-busy={historyQuery.isFetching}>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Acquired quota')}</TableHead>
            <TableHead>{t('Channel')}</TableHead>
            <TableHead>{t('Acquired at')}</TableHead>
            <TableHead>{t('Expires at')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className='font-mono font-medium'>
                {formatQuota(item.quota)}
              </TableCell>
              <TableCell>{getSourceLabel(item.source)}</TableCell>
              <TableCell className='text-muted-foreground'>
                {formatTimestampToDate(item.created_at)}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {item.expires_at === 0
                  ? t('Permanent')
                  : formatTimestampToDate(item.expires_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant='link'
            size='sm'
            className='h-auto max-w-full flex-wrap justify-start p-0 text-left text-[11px] [overflow-wrap:anywhere] whitespace-normal sm:text-xs'
          />
        }
      >
        {t('Gift quota {{quota}}', {
          quota: formatQuota(props.giftQuota),
        })}
      </DialogTrigger>
      <DialogContent className='max-h-[min(80vh,42rem)] overflow-hidden sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{t('Gift quota history')}</DialogTitle>
          <DialogDescription>
            {t('View every gift quota grant and its expiration.')}
          </DialogDescription>
        </DialogHeader>

        <div className='min-h-0 overflow-y-auto'>{content}</div>

        {historyQuery.data && totalPages > 1 && (
          <div className='flex items-center justify-between gap-3 border-t pt-3'>
            <Button
              variant='outline'
              size='icon-sm'
              disabled={page <= 1 || historyQuery.isFetching}
              aria-label={t('Previous')}
              onClick={() => setPage((current) => current - 1)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {t('Page {{current}} of {{total}}', {
                current: page,
                total: totalPages,
              })}
            </span>
            <Button
              variant='outline'
              size='icon-sm'
              disabled={page >= totalPages || historyQuery.isFetching}
              aria-label={t('Next')}
              onClick={() => setPage((current) => current + 1)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
