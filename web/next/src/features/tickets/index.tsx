'use client'

import './i18n'
import { useIsAdmin } from '@/hooks'
import { TicketList } from './components/ticket-list'
import { AdminTicketList } from './components/admin-ticket-list'
import { TicketDetail } from './components/ticket-detail'
import { AdminTicketDetail } from './components/admin-ticket-detail'

export function TicketsPage() {
  const isAdmin = useIsAdmin()
  return isAdmin ? <AdminTicketList /> : <TicketList />
}

export function TicketDetailPage({ ticketId }: { ticketId: number }) {
  const isAdmin = useIsAdmin()
  return isAdmin ? (
    <AdminTicketDetail ticketId={ticketId} />
  ) : (
    <TicketDetail ticketId={ticketId} />
  )
}
