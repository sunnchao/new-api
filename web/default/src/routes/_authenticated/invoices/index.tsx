import { createFileRoute } from '@tanstack/react-router'
import { Invoices } from '@/features/invoices'

export const Route = createFileRoute('/_authenticated/invoices/')({
  component: Invoices,
})
