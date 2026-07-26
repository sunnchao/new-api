import { useState } from 'react'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { SectionPageLayout } from '@/components/layout'
import { PRIORITY_LABELS } from '../constants'
import {
  useTicketDetail,
  useSendTicketMessage,
  useCloseTicket,
  useTicketCategories,
} from '../hooks/use-tickets'
import {
  parseTicketAttachmentUrls,
  serializeTicketAttachmentUrls,
} from '../lib/attachments'
import { sendMessageSchema, type SendMessageForm } from '../lib/schemas'
import type { TicketCategory, TicketMessage } from '../types'
import {
  TicketAttachmentList,
  TicketAttachmentUploader,
} from './ticket-attachments'
import { TicketStatusBadge } from './ticket-status-badge'

export function TicketDetail() {
  const { t } = useTranslation()
  const { ticketId } = useParams({ strict: false }) as { ticketId: string }
  const id = Number(ticketId)
  const navigate = useNavigate()
  const closeMutation = useCloseTicket()
  const sendMutation = useSendTicketMessage(id)
  const [replyAttachments, setReplyAttachments] = useState<string[]>([])

  const { data, isLoading } = useTicketDetail(id)
  const { data: categoriesData } = useTicketCategories()
  const categories: TicketCategory[] = categoriesData?.data || []

  const ticket = data?.data?.ticket
  const messages: TicketMessage[] = data?.data?.messages || []
  const userContext = data?.data?.user_context

  const form = useForm<SendMessageForm>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { content: '' },
  })

  const onSendMessage = (values: SendMessageForm) => {
    sendMutation.mutate(
      {
        ...values,
        attachment_urls: serializeTicketAttachmentUrls(replyAttachments),
      },
      {
        onSuccess: () => {
          form.reset()
          setReplyAttachments([])
        },
      }
    )
  }

  const handleClose = () => {
    closeMutation.mutate(id, { onSuccess: () => navigate({ to: '/tickets' }) })
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

  const categoryLabel =
    categories.find((c) => c.value === ticket.category)?.label ||
    ticket.category

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        #{ticket.id} {ticket.title}
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          size='sm'
          onClick={() => navigate({ to: '/tickets' })}
        >
          <ArrowLeft className='mr-2 size-4' />
          {t('Back')}
        </Button>
        {ticket.status !== 4 && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleClose}
            disabled={closeMutation.isPending}
          >
            {t('Close Ticket')}
          </Button>
        )}
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-3xl space-y-6'>
          <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-sm'>
            <TicketStatusBadge status={ticket.status} />
            <Badge variant='outline'>{categoryLabel}</Badge>
            <Badge variant={ticket.priority === 3 ? 'destructive' : 'outline'}>
              {t(PRIORITY_LABELS[ticket.priority])}
            </Badge>
            <span>
              {dayjs.unix(ticket.created_at).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>

          {userContext && Object.keys(userContext).length > 0 && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm'>{t('User Info')}</CardTitle>
              </CardHeader>
              <CardContent className='text-sm'>
                <div className='grid grid-cols-2 gap-2'>
                  <span>
                    {t('Username')}: {userContext.username as string}
                  </span>
                  <span>
                    {t('Balance')}: {userContext.quota as number}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className='pt-4'>
              <div className='space-y-3'>
                <p className='whitespace-pre-wrap'>{ticket.description}</p>
                <TicketAttachmentList
                  urls={parseTicketAttachmentUrls(ticket.attachment_urls)}
                />
              </div>
            </CardContent>
          </Card>

          <div className='space-y-3'>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${msg.is_admin ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}
                >
                  <div className='mb-1 flex items-center gap-2 text-xs opacity-70'>
                    <span>{msg.is_admin ? t('Admin') : t('User')}</span>
                    <span>
                      {dayjs.unix(msg.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className='space-y-2'>
                    <p className='whitespace-pre-wrap'>{msg.content}</p>
                    <TicketAttachmentList
                      urls={parseTicketAttachmentUrls(msg.attachment_urls)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {ticket.status !== 4 && (
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
