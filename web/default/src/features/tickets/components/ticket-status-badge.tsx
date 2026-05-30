import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { TICKET_STATUS, STATUS_VARIANTS } from '../constants'

export function TicketStatusBadge(props: { status: number }) {
  const { t } = useTranslation()
  const statusLabels: Record<number, string> = {
    [TICKET_STATUS.PENDING]: t('Pending'),
    [TICKET_STATUS.PROGRESS]: t('In Progress'),
    [TICKET_STATUS.REPLIED]: t('Replied'),
    [TICKET_STATUS.CLOSED]: t('Closed'),
  }
  return (
    <Badge variant={STATUS_VARIANTS[props.status] || 'outline'}>
      {statusLabels[props.status] || String(props.status)}
    </Badge>
  )
}
