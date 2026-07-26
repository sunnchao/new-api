import { createFileRoute } from '@tanstack/react-router'
import { UserSubscriptions } from '@/features/subscriptions/user-index'

export const Route = createFileRoute('/_authenticated/my-subscriptions/')({
  component: UserSubscriptions,
})
