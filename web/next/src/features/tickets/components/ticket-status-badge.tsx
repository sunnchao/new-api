'use client'

import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_VARIANTS } from '../constants'

export function TicketStatusBadge({ status }: { status: number }) {
  const { t } = useTranslation()
  return (
    <Badge variant={STATUS_VARIANTS[status] || 'outline'}>
      {t(STATUS_LABELS[status] || 'Unknown')}
    </Badge>
  )
}
