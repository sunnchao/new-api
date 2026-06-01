'use client'

import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { TicketMessage } from '../types'
import { TicketAttachmentList, parseAttachmentUrls } from './ticket-attachments'

export function TicketMessageList({ messages }: { messages: TicketMessage[] }) {
  const { t } = useTranslation()

  if (messages.length === 0) return null

  return (
    <div className='space-y-3'>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
              msg.is_admin
                ? 'bg-muted'
                : 'bg-primary text-primary-foreground'
            }`}
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
                urls={parseAttachmentUrls(msg.attachment_urls)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
