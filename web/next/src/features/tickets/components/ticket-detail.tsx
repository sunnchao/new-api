'use client'

import '../i18n'
import { useState } from 'react'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { SectionPageLayout } from '@/components/layout'
import {
  closeTicket,
  getTicketCategories,
  getTicketDetail,
  sendTicketMessage,
} from '../api'
import { TICKET_STATUS, PRIORITY_LABELS } from '../constants'
import type { TicketCategory, TicketMessage } from '../types'
import { TicketStatusBadge } from './ticket-status-badge'
import { TicketMessageList } from './ticket-message-list'
import {
  TicketAttachmentList,
  TicketAttachmentUploader,
  parseAttachmentUrls,
  serializeAttachmentUrls,
} from './ticket-attachments'

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
})

type SendMessageForm = z.infer<typeof sendMessageSchema>

export function TicketDetail({ ticketId }: { ticketId: number }) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [replyAttachments, setReplyAttachments] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => getTicketDetail(ticketId),
    enabled: !!ticketId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: getTicketCategories,
  })

  const closeMutation = useMutation({
    mutationFn: () => closeTicket(ticketId),
    onSuccess: () => {
      toast.success(t('Ticket closed successfully'))
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
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

  const ticket = data?.data?.ticket
  const messages: TicketMessage[] = data?.data?.messages || []
  const categories: TicketCategory[] = categoriesData?.data || []
  const categoryLabel = (value: string) =>
    categories.find((category) => category.value === value)?.label || value

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
        {ticket.status !== TICKET_STATUS.CLOSED && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
          >
            {t('Close Ticket')}
          </Button>
        )}
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-3xl space-y-6'>
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
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
