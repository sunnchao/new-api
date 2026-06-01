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
import { Check, CreditCard, RefreshCw, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatCurrencyUSD, formatQuota } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import {
  formatDuration,
  formatResetPeriod,
  formatBillingMode,
} from '@/features/subscriptions/lib'
import type { PlanRecord } from '@/features/subscriptions/types'
import { getPublicSubscriptionPlans } from './api'
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

interface PlanCardProps {
  record: PlanRecord
  isAuthenticated: boolean
  featured: boolean
  onSubscribe: () => void
}

function PlanCard({ record, isAuthenticated, featured, onSubscribe }: PlanCardProps) {
  const { t } = useTranslation()
  const plan = record.plan
  const totalAmount = Number(plan.total_amount || 0)
  const isRequestPlan = plan.billing_mode === 'request'

  const fmtPlanAmount = (v: number) =>
    isRequestPlan ? `${v.toLocaleString()} ${t('times')}` : formatQuota(v)

  const benefits = [
    `${t('Validity Period')}: ${formatDuration(plan, t)}`,
    `${t('Billing Mode')}: ${formatBillingMode(plan.billing_mode, t)}`,
    formatResetPeriod(plan, t) !== t('No Reset')
      ? `${t('Quota Reset')}: ${formatResetPeriod(plan, t)}`
      : null,
    totalAmount > 0
      ? `${t('Total Quota')}: ${fmtPlanAmount(totalAmount)}`
      : `${t('Total Quota')}: ${t('Unlimited')}`,
    plan.allowed_groups
      ? `${t('Allowed Groups')}: ${plan.allowed_groups.split(',').map((g) => g.trim()).filter(Boolean).join(', ')}`
      : `${t('Allowed Groups')}: ${t('All Groups')}`,
    plan.max_purchase_per_user > 0
      ? `${t('Purchase Limit')}: ${plan.max_purchase_per_user}`
      : null,
  ].filter(Boolean) as string[]

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        featured && 'border-[var(--accent)] shadow-sm'
      )}
    >
      <CardContent className="flex h-full flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">
              {plan.title || t('Subscription Plans')}
            </h3>
            {plan.subtitle && (
              <p className="truncate text-sm text-[var(--muted)]">
                {plan.subtitle}
              </p>
            )}
          </div>
          {featured && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
              <Sparkles className="h-3 w-3" />
              {t('Recommended')}
            </span>
          )}
        </div>

        <div className="py-3">
          <span className="text-2xl font-bold text-[var(--accent)]">
            {formatCurrencyUSD(Number(plan.price_amount || 0))}
          </span>
        </div>

        <div className="flex-1 space-y-2 pb-4">
          {benefits.map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-[var(--muted)]"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <Separator className="mb-4" />

        {isAuthenticated ? (
          <Button className="w-full" onClick={onSubscribe}>
            {t('Subscribe Now')}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={onSubscribe}>
            {t('Sign in to subscribe')}
          </Button>
        )}
      </CardContent>
    </Card>
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
    if (isAuthenticated) {
      router.push('/wallet')
    } else {
      router.push(`/sign-in?next=${encodeURIComponent('/subscription-plans')}`)
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
                <PlanCard
                  key={record.plan.id}
                  record={record}
                  isAuthenticated={isAuthenticated}
                  featured={index === 0 && plans.length > 1}
                  onSubscribe={() => handleSubscribe(record)}
                />
              ))}
            </div>
          </>
        )}
      </PageTransition>
    </PublicLayout>
  )
}
