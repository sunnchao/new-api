'use client'

import './i18n'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useIsAdmin } from '@/hooks'
import { TicketList } from './components/ticket-list'
import { AdminTicketList } from './components/admin-ticket-list'
import { TicketDetail } from './components/ticket-detail'
import { AdminTicketDetail } from './components/admin-ticket-detail'

function useLegacyAdminTicketGuard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = useIsAdmin()
  const requiresLegacyAdmin = searchParams.get('legacy_admin') === '1'

  useEffect(() => {
    if (requiresLegacyAdmin && !isAdmin) {
      router.replace('/403')
    }
  }, [isAdmin, requiresLegacyAdmin, router])

  return { isAdmin, requiresLegacyAdmin }
}

export function TicketsPage() {
  const { isAdmin, requiresLegacyAdmin } = useLegacyAdminTicketGuard()
  if (requiresLegacyAdmin && !isAdmin) return null
  return isAdmin ? <AdminTicketList /> : <TicketList />
}

export function TicketDetailPage({ ticketId }: { ticketId: number }) {
  const { isAdmin, requiresLegacyAdmin } = useLegacyAdminTicketGuard()
  if (requiresLegacyAdmin && !isAdmin) return null
  return isAdmin ? (
    <AdminTicketDetail ticketId={ticketId} />
  ) : (
    <TicketDetail ticketId={ticketId} />
  )
}
