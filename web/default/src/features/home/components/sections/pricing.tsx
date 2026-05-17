import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { AnimateInView } from '@/components/animate-in-view'
import { getHomePlans } from '@/features/subscriptions/api'
import { PublicSubscriptionPlanCard } from '@/features/subscriptions/components/public-subscription-plan-card'
import type { PlanRecord } from '@/features/subscriptions/types'

interface PricingProps {
  className?: string
}

export function Pricing(_props: PricingProps) {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = !!auth.user
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        const res = await getHomePlans()
        if (!cancelled && res.success) {
          setPlans(res.data || [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => {
      cancelled = true
    }
  }, [])

  const visiblePlans = plans.filter(
    (p) => p?.plan?.enabled && p?.plan?.show_on_home
  )

  if (loading || visiblePlans.length === 0) return null

  return (
    <section className='relative z-10 overflow-hidden px-6 py-24 md:py-32'>
      {/* Background */}
      <div
        aria-hidden
        className='absolute inset-0 -z-10 opacity-15 dark:opacity-[0.06]'
        style={{
          background: [
            'radial-gradient(ellipse 50% 50% at 50% 50%, oklch(0.7 0.15 150 / 60%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div className='mx-auto max-w-5xl'>
        <AnimateInView className='mb-16 text-center' animation='fade-up'>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
            {t('Choose Your Plan')}
          </h2>
          <p className='text-muted-foreground/80 mx-auto mt-4 max-w-md text-sm leading-relaxed md:text-base'>
            {t('Flexible plans for every need')}
          </p>
        </AnimateInView>

        <div
          className={cn(
            'grid gap-6',
            visiblePlans.length === 1
              ? 'mx-auto max-w-md grid-cols-1'
              : visiblePlans.length === 2
                ? 'mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {visiblePlans.map((p, index) => {
            const plan = p?.plan
            if (!plan) return null
            const isPopular = index === 0 && visiblePlans.length > 1

            return (
              <AnimateInView
                key={plan.id}
                animation='scale-in'
                delay={index * 100}
              >
                <PublicSubscriptionPlanCard
                  record={p}
                  isAuthenticated={isAuthenticated}
                  featured={isPopular}
                  mode='home'
                />
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
