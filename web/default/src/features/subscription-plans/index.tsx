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
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { getPublicSubscriptionPlans } from './api'
import { SubscriptionPlanCard } from './components/plan-card'

function SubscriptionPlansLoading() {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className='h-[420px] rounded-lg' />
      ))}
    </div>
  )
}

export function SubscriptionPlans() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = Boolean(auth.user)

  const plansQuery = useQuery({
    queryKey: ['public-subscription-plans'],
    queryFn: getPublicSubscriptionPlans,
  })

  const plans = (plansQuery.data?.data || []).filter((item) => item?.plan)

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-20 dark:opacity-[0.10]'
          style={{
            background: [
              'radial-gradient(ellipse 55% 45% at 18% 20%, oklch(0.70 0.16 150 / 70%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 78% 16%, oklch(0.68 0.14 220 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 52% 70%, oklch(0.72 0.12 95 / 40%) 0%, transparent 70%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />

        <PageTransition className='relative mx-auto w-full max-w-[1280px] px-3 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12 xl:px-8'>
          <header className='mx-auto mb-8 max-w-3xl pt-5 text-center sm:mb-12 sm:pt-10'>
            <p className='mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase'>
              {t('Subscription Catalog')}
            </p>
            <h1 className='text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.15] font-bold tracking-tight'>
              {t('Subscription Plans')}
            </h1>
            <p className='mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/70 sm:mt-4 sm:text-base'>
              {t(
                'Browse available subscription plans and choose the access package that fits your usage.'
              )}
            </p>
          </header>

          {plansQuery.isLoading ? (
            <SubscriptionPlansLoading />
          ) : plansQuery.isError ? (
            <EmptyState
              icon={RefreshCw}
              bordered
              title={t('Unable to load subscription plans')}
              description={t('Please refresh the page and try again.')}
            />
          ) : plans.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              bordered
              title={t('No subscription plans available')}
              description={t('There are no enabled subscription plans yet.')}
            />
          ) : (
            <>
              <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                <p className='text-sm text-muted-foreground'>
                  {t('{{count}} plan(s) available', { count: plans.length })}
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => plansQuery.refetch()}
                  disabled={plansQuery.isFetching}
                >
                  <RefreshCw
                    className={plansQuery.isFetching ? 'animate-spin' : ''}
                  />
                  {t('Refresh')}
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                {plans.map((record, index) => (
                  <SubscriptionPlanCard
                    key={record.plan.id}
                    record={record}
                    isAuthenticated={isAuthenticated}
                    featured={index === 0 && plans.length > 1}
                  />
                ))}
              </div>
            </>
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}
