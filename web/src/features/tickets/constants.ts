export const TICKET_STATUS = {
  PENDING: 1,
  PROGRESS: 2,
  REPLIED: 3,
  CLOSED: 4,
} as const

export const TICKET_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const

export const STATUS_LABELS: Record<number, string> = {
  [TICKET_STATUS.PENDING]: 'Pending',
  [TICKET_STATUS.PROGRESS]: 'In Progress',
  [TICKET_STATUS.REPLIED]: 'Replied',
  [TICKET_STATUS.CLOSED]: 'Closed',
}

export const PRIORITY_LABELS: Record<number, string> = {
  [TICKET_PRIORITY.LOW]: 'Low',
  [TICKET_PRIORITY.MEDIUM]: 'Medium',
  [TICKET_PRIORITY.HIGH]: 'High',
}

export const STATUS_VARIANTS: Record<number, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [TICKET_STATUS.PENDING]: 'outline',
  [TICKET_STATUS.PROGRESS]: 'secondary',
  [TICKET_STATUS.REPLIED]: 'default',
  [TICKET_STATUS.CLOSED]: 'destructive',
}

export const PRIORITY_VARIANTS: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [TICKET_PRIORITY.LOW]: 'outline',
  [TICKET_PRIORITY.MEDIUM]: 'secondary',
  [TICKET_PRIORITY.HIGH]: 'destructive',
}

export const SUCCESS_MESSAGES = {
  TICKET_CREATED: 'Ticket created successfully',
  TICKET_CLOSED: 'Ticket closed successfully',
  MESSAGE_SENT: 'Reply sent successfully',
  STATUS_UPDATED: 'Status updated successfully',
  TICKET_ASSIGNED: 'Ticket assigned successfully',
  TICKET_DELETED: 'Ticket deleted successfully',
}

export const ERROR_MESSAGES = {
  UNEXPECTED: 'An unexpected error occurred',
  TICKET_NOT_FOUND: 'Ticket not found',
  PERMISSION_DENIED: 'Permission denied',
}
