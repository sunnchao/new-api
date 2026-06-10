'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Search, Trash2, UserPlus } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SectionPageLayout } from '@/components/layout'
import {
  assignTicket,
  deleteTicket,
  getAllTickets,
  getTicketCategories,
  isTicketActionSuccess,
  searchTickets,
  updateTicketStatus,
} from '../api'
import { useAuthStore } from '@/stores/auth-store'
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  PRIORITY_LABELS,
  PRIORITY_VARIANTS,
  STATUS_LABELS,
  SUCCESS_MESSAGES,
} from '../constants'
import type { Ticket, TicketCategory } from '../types'
import { TicketStatusBadge } from './ticket-status-badge'

const STATUS_KEYS = ['Pending', 'In Progress', 'Replied', 'Closed']
const PRIORITY_KEYS = ['Low', 'Medium', 'High']
const ALL_CATEGORIES = '__all__'

export function AdminTicketList() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentAdminId = useAuthStore((state) => state.auth.user?.id) || 0
  const [statusFilter, setStatusFilter] = useState<number>(0)
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [priorityFilter, setPriorityFilter] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)

  const { data: categoriesData } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: getTicketCategories,
  })
  const categories: TicketCategory[] = categoriesData?.data || []
  const categoryLabel = (value: string) =>
    categories.find((category) => category.value === value)?.label || value

  const listQuery = useQuery({
    queryKey: [
      'tickets',
      'admin',
      page,
      statusFilter,
      categoryFilter,
      priorityFilter,
    ],
    queryFn: () =>
      getAllTickets({
        p: page,
        page_size: 10,
        status: statusFilter || undefined,
        category:
          categoryFilter === ALL_CATEGORIES ? undefined : categoryFilter,
        priority: priorityFilter || undefined,
      }),
    enabled: !isSearching,
  })

  const searchQuery = useQuery({
    queryKey: ['tickets', 'admin', 'search', searchKeyword, page, statusFilter],
    queryFn: () =>
      searchTickets({
        keyword: searchKeyword,
        status: statusFilter || undefined,
        p: page,
        page_size: 10,
      }),
    enabled: isSearching && searchKeyword.length > 0,
  })

  const data = isSearching ? searchQuery.data : listQuery.data
  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading
  const tickets: Ticket[] = data?.data?.items || []
  const total: number = data?.data?.total || 0
  const statusCounts = tickets.reduce(
    (acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    },
    {} as Record<number, number>
  )

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      updateTicketStatus(id, { status }),
    onSuccess: (response) => {
      if (!isTicketActionSuccess(response)) return

      toast.success(t(SUCCESS_MESSAGES.STATUS_UPDATED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const priorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: number; priority: number }) =>
      updateTicketStatus(id, { priority }),
    onSuccess: (response) => {
      if (!isTicketActionSuccess(response)) return

      toast.success(t(SUCCESS_MESSAGES.STATUS_UPDATED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTicket(id),
    onSuccess: (response) => {
      if (!isTicketActionSuccess(response)) return

      toast.success(t(SUCCESS_MESSAGES.TICKET_DELETED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setDeleteTarget(null)
    },
  })

  const assignToMeMutation = useMutation({
    mutationFn: (id: number) =>
      assignTicket(id, { admin_id: currentAdminId }),
    onSuccess: (response) => {
      if (!isTicketActionSuccess(response)) return

      toast.success(t(SUCCESS_MESSAGES.TICKET_ASSIGNED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setIsSearching(value.length > 0)
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
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Priority')}</TableHead>
              <TableHead>{t('Category')}</TableHead>
              <TableHead>{t('Assigned To')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead className='w-[50px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className='font-mono'>#{ticket.id}</TableCell>
                <TableCell
                  className='cursor-pointer font-medium hover:underline'
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  {ticket.title}
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANTS[ticket.priority] || 'outline'}>
                    {t(PRIORITY_LABELS[ticket.priority] || 'Unknown')}
                  </Badge>
                </TableCell>
                <TableCell>{categoryLabel(ticket.category)}</TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {ticket.assigned_admin_id > 0
                    ? `#${ticket.assigned_admin_id}`
                    : '-'}
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {dayjs.unix(ticket.created_at).format('YYYY-MM-DD HH:mm')}
                </TableCell>
                <TableCell>
                  <RowActions
                    ticket={ticket}
                    onChangeStatus={(status) =>
                      statusMutation.mutate({ id: ticket.id, status })
                    }
                    onChangePriority={(priority) =>
                      priorityMutation.mutate({ id: ticket.id, priority })
                    }
                    onDelete={() => setDeleteTarget(ticket)}
                    onView={() => router.push(`/tickets/${ticket.id}`)}
                    canAssignToMe={
                      !!currentAdminId &&
                      ticket.status !== TICKET_STATUS.CLOSED &&
                      ticket.assigned_admin_id !== currentAdminId
                    }
                    onAssignToMe={() => assignToMeMutation.mutate(ticket.id)}
                  />
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
      <SectionPageLayout.Title>{t('Ticket Management')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3 text-sm'>
            {Object.entries(TICKET_STATUS).map(([key, value]) => (
              <span key={key} className='text-muted-foreground'>
                {t(STATUS_KEYS[value - 1])}: {statusCounts[value] || 0}
              </span>
            ))}
          </div>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative w-[240px]'>
              <Search className='text-muted-foreground absolute left-2.5 top-2.5 size-4' />
              <Input
                placeholder={t('Search tickets')}
                className='pl-9'
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select
              value={String(statusFilter)}
              onValueChange={(v) => {
                setStatusFilter(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className='w-[150px]'>
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
            <Select
              value={String(priorityFilter)}
              onValueChange={(v) => {
                setPriorityFilter(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('All Priorities')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='0'>{t('All Priorities')}</SelectItem>
                {Object.entries(TICKET_PRIORITY).map(([key, value]) => (
                  <SelectItem key={key} value={String(value)}>
                    {t(PRIORITY_KEYS[value - 1])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('All Categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>
                  {t('All Categories')}
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
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
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Delete Ticket')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('Are you sure you want to delete this ticket? This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              >
                {t('Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}

function RowActions({
  ticket,
  onChangeStatus,
  onChangePriority,
  onDelete,
  onView,
  canAssignToMe,
  onAssignToMe,
}: {
  ticket: Ticket
  onChangeStatus: (status: number) => void
  onChangePriority: (priority: number) => void
  onDelete: () => void
  onView: () => void
  canAssignToMe: boolean
  onAssignToMe: () => void
}) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='size-8'>
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={onView}>
          {t('View Detail')}
        </DropdownMenuItem>
        {canAssignToMe && (
          <DropdownMenuItem onClick={onAssignToMe}>
            <UserPlus className='mr-2 size-4' />
            {t('Assign to me')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t('Change Status')}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {Object.entries(TICKET_STATUS).map(([key, value]) => (
              <DropdownMenuItem
                key={key}
                disabled={ticket.status === value}
                onClick={() => onChangeStatus(value)}
              >
                {t(STATUS_LABELS[value])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t('Change Priority')}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {Object.entries(TICKET_PRIORITY).map(([key, value]) => (
              <DropdownMenuItem
                key={key}
                disabled={ticket.priority === value}
                onClick={() => onChangePriority(value)}
              >
                {t(PRIORITY_LABELS[value])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive'
          onClick={onDelete}
        >
          <Trash2 className='mr-2 size-4' />
          {t('Delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
