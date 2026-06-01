'use client'

import './i18n'
import { useIsAdmin } from '@/hooks'
import { TicketList } from './components/ticket-list'
import { AdminTicketList } from './components/admin-ticket-list'

export function TicketsPage() {
  const isAdmin = useIsAdmin()
  return isAdmin ? <AdminTicketList /> : <TicketList />
}
