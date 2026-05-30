import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { TICKET_STATUS } from '../constants'
import { useUserTickets, useAllTickets, useTicketCategories } from '../hooks/use-tickets'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import type { Ticket, TicketCategory } from '../types'
import { CreateTicketDialog } from './create-ticket-dialog'
import { TicketStatusBadge } from './ticket-status-badge'
import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'

const STATUS_KEYS = ['Pending', 'In Progress', 'Replied', 'Closed']
const PRIORITY_KEYS = ['Low', 'Medium', 'High']

function priorityVariant(priority: number): 'destructive' | 'secondary' | 'outline' {
  if (priority === 3) return 'destructive'
  if (priority === 2) return 'secondary'
  return 'outline'
}

export function TicketList() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<number>(0)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const userRole = useAuthStore((s) => s.auth.user?.role)
  const isAdmin = userRole !== undefined && userRole >= ROLE.ADMIN

  const userQuery = useUserTickets({ p: page, page_size: 10, status: statusFilter || undefined })
  const adminQuery = useAllTickets({ p: page, page_size: 10, status: statusFilter || undefined, category: categoryFilter || undefined })
  const { data, isLoading } = isAdmin ? adminQuery : userQuery

  const { data: categoriesData } = useTicketCategories()
  const categories: TicketCategory[] = categoriesData?.data || []
  const categoryLabel = (value: string) =>
    categories.find((c) => c.value === value)?.label || value

  const tickets: Ticket[] = data?.data?.items || []
  const total: number = data?.data?.total || 0

  let listContent: ReactNode
  if (isLoading) {
    listContent = (
      <div className='text-muted-foreground py-8 text-center'>{t('Loading')}...</div>
    )
  } else if (tickets.length === 0) {
    listContent = (
      <div className='text-muted-foreground py-8 text-center'>{t('No tickets found')}</div>
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
              {isAdmin && <TableHead>{t('Assigned To')}</TableHead>}
              <TableHead>{t('Created At')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className='font-mono'>#{ticket.id}</TableCell>
                <TableCell>
                  <Link to='/tickets/$ticketId' params={{ ticketId: String(ticket.id) }} className='hover:underline'>
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>{categoryLabel(ticket.category)}</TableCell>
                <TableCell>
                  <Badge variant={priorityVariant(ticket.priority)}>
                    {t(PRIORITY_KEYS[ticket.priority - 1])}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                {isAdmin && (
                  <TableCell className='text-muted-foreground text-sm'>
                    {ticket.assigned_admin_id > 0 ? `#${ticket.assigned_admin_id}` : '-'}
                  </TableCell>
                )}
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
      <SectionPageLayout.Title>
        {isAdmin ? t('Ticket Management') : t('My Tickets')}
      </SectionPageLayout.Title>
      {!isAdmin && (
        <SectionPageLayout.Actions>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className='mr-2 size-4' />
            {t('Create Ticket')}
          </Button>
        </SectionPageLayout.Actions>
      )}
      <SectionPageLayout.Content>
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={String(statusFilter)} onValueChange={(v) => { setStatusFilter(Number(v)); setPage(1) }}>
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
            {isAdmin && (
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? ''); setPage(1) }}>
                <SelectTrigger className='w-[160px]'>
                  <SelectValue placeholder={t('All Categories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>{t('All Categories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {listContent}

          {total > 10 && (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>{t('Total')}: {total}</span>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {t('Previous')}
                </Button>
                <Button variant='outline' size='sm' disabled={page * 10 >= total} onClick={() => setPage(page + 1)}>
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}

          <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} categories={categories} />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
