'use client'

import '../i18n'
import { useState } from 'react'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Trash2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
  getTicketCategories,
  getTicketDetail,
  sendTicketMessage,
  updateTicketStatus,
} from '../api'
import { useAuthStore } from '@/stores/auth-store'
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  STATUS_LABELS,
  PRIORITY_LABELS,
  SUCCESS_MESSAGES,
} from '../constants'
import type { TicketCategory, TicketMessage } from '../types'
import { TicketStatusBadge } from './ticket-status-badge'
import { TicketMessageList } from './ticket-message-list'
import {
  TicketAttachmentList,
  TicketAttachmentUploader,
  parseAttachmentUrls,
  serializeAttachmentUrls,
} from './ticket-attachments'
import { UserContextPanel } from './user-context-panel'
import { AssignTicketDialog } from './assign-ticket-dialog'

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
})

type SendMessageForm = z.infer<typeof sendMessageSchema>

const STATUS_KEYS = ['Pending', 'In Progress', 'Replied', 'Closed']
const PRIORITY_KEYS = ['Low', 'Medium', 'High']

export function AdminTicketDetail({ ticketId }: { ticketId: number }) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentAdminId = useAuthStore((state) => state.auth.user?.id) || 0
  const [replyAttachments, setReplyAttachments] = useState<string[]>([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => getTicketDetail(ticketId),
    enabled: !!ticketId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: getTicketCategories,
  })

  const sendMutation = useMutation({
    mutationFn: (msgData: { content: string; attachment_urls?: string }) =>
      sendTicketMessage(ticketId, msgData),
    onSuccess: () => {
      toast.success(t('Reply sent successfully'))
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] })
      form.reset()
      setReplyAttachments([])
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: number) => updateTicketStatus(ticketId, { status }),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.STATUS_UPDATED))
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const priorityMutation = useMutation({
    mutationFn: (priority: number) => updateTicketStatus(ticketId, { priority }),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.STATUS_UPDATED))
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicket(ticketId),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_DELETED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      router.push('/tickets')
    },
  })

  const assignToMeMutation = useMutation({
    mutationFn: () =>
      assignTicket(ticketId, { admin_id: currentAdminId }),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_ASSIGNED))
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const ticket = data?.data?.ticket
  const messages: TicketMessage[] = data?.data?.messages || []
  const categories: TicketCategory[] = categoriesData?.data || []
  const categoryLabel = (value: string) =>
    categories.find((category) => category.value === value)?.label || value
  const userContext = data?.data?.user_context
  const canAssignToMe =
    !!currentAdminId &&
    ticket?.status !== TICKET_STATUS.CLOSED &&
    ticket?.assigned_admin_id !== currentAdminId

  const form = useForm<SendMessageForm>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { content: '' },
  })

  const onSendMessage = (values: SendMessageForm) => {
    sendMutation.mutate({
      ...values,
      attachment_urls: serializeAttachmentUrls(replyAttachments),
    })
  }

  if (isLoading) {
    return (
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Ticket Detail')}</SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='text-muted-foreground py-8 text-center'>
            {t('Loading')}...
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    )
  }

  if (!ticket) {
    return (
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Ticket Detail')}</SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='text-muted-foreground py-8 text-center'>
            {t('Ticket not found')}
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        #{ticket.id} {ticket.title}
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          size='sm'
          onClick={() => router.push('/tickets')}
        >
          <ArrowLeft className='mr-2 size-4' />
          {t('Back')}
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setAssignOpen(true)}
        >
          <UserPlus className='mr-2 size-4' />
          {t('Assign')}
        </Button>
        {canAssignToMe && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => assignToMeMutation.mutate()}
            disabled={assignToMeMutation.isPending}
          >
            <UserPlus className='mr-2 size-4' />
            {t('Assign to me')}
          </Button>
        )}
        <Button
          variant='destructive'
          size='sm'
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className='mr-2 size-4' />
          {t('Delete')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-4xl space-y-6'>
          {/* Admin controls row */}
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm'>{t('Status')}:</span>
              <Select
                value={String(ticket.status)}
                onValueChange={(v) => statusMutation.mutate(Number(v))}
              >
                <SelectTrigger className='h-8 w-[140px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={String(value)}>
                      {t(STATUS_KEYS[value - 1])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm'>{t('Priority')}:</span>
              <Select
                value={String(ticket.priority)}
                onValueChange={(v) => priorityMutation.mutate(Number(v))}
              >
                <SelectTrigger className='h-8 w-[120px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_PRIORITY).map(([key, value]) => (
                    <SelectItem key={key} value={String(value)}>
                      {t(PRIORITY_KEYS[value - 1])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {ticket.assigned_admin_id > 0 && (
              <Badge variant='outline'>
                {t('Assigned To')}: #{ticket.assigned_admin_id}
              </Badge>
            )}
          </div>

          {/* Ticket metadata */}
          <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-sm'>
            <TicketStatusBadge status={ticket.status} />
            <Badge variant='outline'>{categoryLabel(ticket.category)}</Badge>
            <Badge variant={ticket.priority === 3 ? 'destructive' : 'outline'}>
              {t(PRIORITY_LABELS[ticket.priority])}
            </Badge>
            <span>
              {dayjs.unix(ticket.created_at).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>

          {/* User context panel */}
          <UserContextPanel userContext={userContext as Record<string, unknown> || {}} />

          {/* Original description */}
          <Card>
            <CardContent className='pt-4'>
              <div className='space-y-3'>
                <p className='whitespace-pre-wrap'>{ticket.description}</p>
                <TicketAttachmentList
                  urls={parseAttachmentUrls(ticket.attachment_urls)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Message thread */}
          <TicketMessageList messages={messages} />

          {/* Reply form */}
          {ticket.status !== TICKET_STATUS.CLOSED && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSendMessage)}
                className='space-y-3'
              >
                <div className='flex gap-3'>
                  <FormField
                    control={form.control}
                    name='content'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder={t('Type your reply')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type='submit'
                    size='icon'
                    disabled={sendMutation.isPending}
                  >
                    <Send className='size-4' />
                  </Button>
                </div>
                <TicketAttachmentUploader
                  value={replyAttachments}
                  onChange={setReplyAttachments}
                  disabled={sendMutation.isPending}
                />
              </form>
            </Form>
          )}
        </div>

        {/* Assign dialog */}
        <AssignTicketDialog
          ticketId={ticketId}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />

        {/* Delete confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Delete Ticket')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('Are you sure you want to delete this ticket? This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                {t('Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
