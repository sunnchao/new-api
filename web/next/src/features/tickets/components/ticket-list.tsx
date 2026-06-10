'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, RotateCcw, Search } from 'lucide-react'
import dayjs from 'dayjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionPageLayout } from '@/components/layout'
import { getTicketCategories, getUserTickets, searchUserTickets } from '../api'
import { TICKET_STATUS, PRIORITY_LABELS, PRIORITY_VARIANTS } from '../constants'
import type { Ticket, TicketCategory } from '../types'
import { TicketStatusBadge } from './ticket-status-badge'
import { CreateTicketDialog } from './create-ticket-dialog'

const STATUS_KEYS = ['Pending', 'In Progress', 'Replied', 'Closed']

export function TicketList() {
  const { t } = useTranslation()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const normalizedSearchKeyword = searchKeyword.trim()

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'user', page, statusFilter, normalizedSearchKeyword],
    queryFn: () =>
      normalizedSearchKeyword
        ? searchUserTickets({
            keyword: normalizedSearchKeyword,
            status: statusFilter || undefined,
            p: page,
            page_size: 10,
          })
        : getUserTickets({
            p: page,
            page_size: 10,
            status: statusFilter || undefined,
          }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: getTicketCategories,
  })

  const tickets: Ticket[] = data?.data?.items || []
  const total: number = data?.data?.total || 0
  const categories: TicketCategory[] = categoriesData?.data || []
  const categoryLabel = (value: string) =>
    categories.find((category) => category.value === value)?.label || value

  // Summary stats
  const statusCounts = tickets.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    },
    {} as Record<number, number>
  )

  const handleSearch = () => {
    setSearchKeyword(keyword.trim())
    setPage(1)
  }

  const handleReset = () => {
    setKeyword('')
    setSearchKeyword('')
    setStatusFilter(0)
    setPage(1)
  }

  let listContent
  if (isLoading) {
    listContent = (
      <div className='text-muted-foreground py-8 text-center'>
        {t('Loading')}...
      </div>
    )
  } else if (tickets.length === 0) {
    listContent = (
      <div className='text-muted-foreground py-8 text-center'>
        {t('No tickets found')}
      </div>
    )
  } else {
    listContent = (
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[60px]'>ID</TableHead>
              <TableHead>{t('Title')}</TableHead>
              <TableHead>{t('Category')}</TableHead>
              <TableHead>{t('Priority')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className='cursor-pointer'
                onClick={() => router.push(`/tickets/${ticket.id}`)}
              >
                <TableCell className='font-mono'>#{ticket.id}</TableCell>
                <TableCell className='font-medium'>{ticket.title}</TableCell>
                <TableCell>{categoryLabel(ticket.category)}</TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANTS[ticket.priority] || 'outline'}>
                    {t(PRIORITY_LABELS[ticket.priority] || 'Unknown')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {dayjs.unix(ticket.created_at).format('YYYY-MM-DD HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('My Tickets')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='mr-2 size-4' />
          {t('Create Ticket')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='space-y-4'>
          {/* Summary stats bar */}
          <div className='flex flex-wrap gap-3 text-sm'>
            {Object.entries(TICKET_STATUS).map(([key, value]) => (
              <span key={key} className='text-muted-foreground'>
                {t(STATUS_KEYS[value - 1])}: {statusCounts[value] || 0}
              </span>
            ))}
          </div>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative w-full sm:w-[240px]'>
              <Search className='text-muted-foreground absolute left-2.5 top-2.5 size-4' />
              <Input
                placeholder={t('Search tickets')}
                className='pl-9'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
              />
            </div>
            <Button variant='secondary' onClick={handleSearch}>
              <Search className='size-4' />
              {t('Search')}
            </Button>
            <Button variant='ghost' onClick={handleReset}>
              <RotateCcw className='size-4' />
              {t('Reset')}
            </Button>
            <Select
              value={String(statusFilter)}
              onValueChange={(v) => {
                setStatusFilter(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder={t('All Statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='0'>{t('All Statuses')}</SelectItem>
                {Object.entries(TICKET_STATUS).map(([key, value]) => (
                  <SelectItem key={key} value={String(value)}>
                    {t(STATUS_KEYS[value - 1])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listContent}

          {total > 10 && (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Total')}: {total}
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('Previous')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page * 10 >= total}
                  onClick={() => setPage(page + 1)}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}

          <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
