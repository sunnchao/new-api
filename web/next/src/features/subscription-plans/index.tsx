'use client'
/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQuery } from '@tanstack/react-query'
import { CreditCard, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatCurrencyUSD } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import type { PlanRecord } from '@/features/subscriptions/types'
import { getPublicSubscriptionPlans } from './api'
import { SubscriptionPlanCard } from './components/plan-card'
import './i18n'

function SubscriptionPlansLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-[420px] rounded-lg" />
      ))}
    </div>
  )
}

export function SubscriptionPlansPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { auth } = useAuthStore()
  const isAuthenticated = Boolean(auth.user)

  const plansQuery = useQuery({
    queryKey: ['public-subscription-plans'],
    queryFn: getPublicSubscriptionPlans,
  })

  const plans = (plansQuery.data?.data || []).filter((item) => item?.plan)

  const lowestPrice =
    plans.length > 0
      ? Math.min(...plans.map((p) => Number(p.plan.price_amount || 0)))
      : null

  const handleSubscribe = (record: PlanRecord) => {
    const purchasePath = `/my-subscriptions?plan_id=${encodeURIComponent(
      String(record.plan.id)
    )}`

    if (isAuthenticated) {
      router.push(purchasePath)
    } else {
      router.push(`/sign-in?redirect=${encodeURIComponent(purchasePath)}`)
    }
  }

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className="mx-auto w-full max-w-[1280px] px-3 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12 xl:px-8">
        <header className="mx-auto mb-8 max-w-3xl pt-5 text-center sm:mb-12 sm:pt-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
            {t('Subscription Catalog')}
          </p>
          <h1 className="text-[clamp(2rem,5.5vw,3.5rem)] font-bold leading-[1.15] tracking-tight">
            {t('Subscription Plans')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:mt-4 sm:text-base">
            {t(
              'Browse available subscription plans and choose the access package that fits your usage.'
            )}
          </p>
        </header>

        {plansQuery.isLoading ? (
          <SubscriptionPlansLoading />
        ) : plansQuery.isError ? (
          <EmptyState
            icon={<RefreshCw className="h-5 w-5" />}
            title={t('Unable to load subscription plans')}
            description={t('Please refresh the page and try again.')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => plansQuery.refetch()}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {t('Refresh')}
              </Button>
            }
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-5 w-5" />}
            title={t('No subscription plans available')}
            description={t('There are no enabled subscription plans yet.')}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                {t('{{count}} plan(s) available', { count: plans.length })}
                {lowestPrice !== null && (
                  <span className="ml-2">
                    · {t('Starting from')} {formatCurrencyUSD(lowestPrice)}
                  </span>
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => plansQuery.refetch()}
                disabled={plansQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    'mr-1.5 h-3.5 w-3.5',
                    plansQuery.isFetching && 'animate-spin'
                  )}
                />
                {t('Refresh')}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((record, index) => (
                <SubscriptionPlanCard
                  key={record.plan.id}
                  record={record}
                  isAuthenticated={isAuthenticated}
                  featured={index === 0 && plans.length > 1}
                  actionOverride={{
                    labelKey: isAuthenticated
                      ? 'Subscribe Now'
                      : 'Sign in to subscribe',
                    onClick: () => handleSubscribe(record),
                  }}
                />
              ))}
            </div>
          </>
        )}
      </PageTransition>
    </PublicLayout>
  )
}
