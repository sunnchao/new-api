import { createFileRoute } from '@tanstack/react-router'
import { TicketDetail } from '@/features/tickets'

export const Route = createFileRoute('/_authenticated/tickets/$ticketId')({
  component: TicketDetail,
})
