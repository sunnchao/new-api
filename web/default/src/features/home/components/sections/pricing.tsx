import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { formatQuota, formatCurrencyUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'
import { StatusBadge } from '@/components/status-badge'
import { getHomePlans } from '@/features/subscriptions/api'
import {
  formatDuration,
  formatResetPeriod,
  formatBillingMode,
} from '@/features/subscriptions/lib'
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
            const totalAmount = Number(plan.total_amount || 0)
            const priceAmount = Number(plan.price_amount || 0)
            const isPopular = index === 0 && visiblePlans.length > 1

            const isRequest = plan.billing_mode === 'request'
            const fmt = (v: number) =>
              isRequest ? v.toLocaleString() + t('times') : formatQuota(v)
            const approxSuffix = (n?: number) =>
              n && n > 0
                ? ` (${t('Approx.')} ${n.toLocaleString()}${t('times')})`
                : ''

            const rateLimits: string[] = []
            const hourlyLimit = plan.hourly_limit_amount || 0
            const dailyLimit = plan.daily_limit_amount || 0
            const weeklyLimit = plan.weekly_limit_amount || 0
            const monthlyLimit = plan.monthly_limit_amount || 0
            if (hourlyLimit > 0) {
              rateLimits.push(
                `${t('Every')}${plan.hourly_limit_hours || 1}${t('hours')}: ${fmt(hourlyLimit)}${approxSuffix(plan.hourly_approximate_times)}`
              )
            }
            if (dailyLimit > 0) {
              rateLimits.push(
                `${t('Daily')}: ${fmt(dailyLimit)}${approxSuffix(plan.daily_approximate_times)}`
              )
            }
            if (weeklyLimit > 0) {
              rateLimits.push(
                `${t('Weekly')}: ${fmt(weeklyLimit)}${approxSuffix(plan.weekly_approximate_times)}`
              )
            }
            if (monthlyLimit > 0) {
              rateLimits.push(
                `${t('Monthly')}: ${fmt(monthlyLimit)}${approxSuffix(plan.monthly_approximate_times)}`
              )
            }

            const allowedGroups =
              plan.allowed_groups
                ?.split(',')
                .map((g) => g.trim())
                .filter(Boolean) || []

            const benefits = [
              t('Validity Period') + ': ' + formatDuration(plan, t),
              t('Billing Mode') +
                ': ' +
                formatBillingMode(plan.billing_mode, t),
              formatResetPeriod(plan, t) !== t('No Reset')
                ? t('Quota Reset') + ': ' + formatResetPeriod(plan, t)
                : null,
              totalAmount > 0
                ? t('Total Quota') +
                  ': ' +
                  fmt(totalAmount) +
                  approxSuffix(plan.approximate_times)
                : t('Total Quota') + ': ' + t('Unlimited'),
              ...rateLimits,
              allowedGroups.length > 0
                ? t('Allowed Groups') + ': ' + allowedGroups.join(', ')
                : null,
              plan.upgrade_group
                ? t('Upgrade Group') + ': ' + plan.upgrade_group
                : null,
            ].filter(Boolean) as string[]

            return (
              <AnimateInView
                key={plan.id}
                animation='scale-in'
                delay={index * 100}
              >
                <div
                  className={cn(
                    'flex h-full flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg',
                    isPopular
                      ? 'border-primary/50 shadow-md'
                      : 'border-border/50'
                  )}
                >
                  <div className='mb-4 flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h3 className='text-lg font-semibold'>
                        {plan.title || t('Plan')}
                      </h3>
                      {plan.subtitle && (
                        <p className='text-muted-foreground mt-0.5 text-xs'>
                          {plan.subtitle}
                        </p>
                      )}
                    </div>
                    {isPopular && (
                      <StatusBadge
                        variant='info'
                        copyable={false}
                        className='shrink-0'
                      >
                        <Sparkles className='h-3 w-3' />
                        {t('Recommended')}
                      </StatusBadge>
                    )}
                  </div>

                  <div className='mb-5'>
                    <span className='text-primary text-3xl font-bold'>
                      {formatCurrencyUSD(priceAmount)}
                    </span>
                  </div>

                  <div className='flex-1 space-y-2.5 pb-5'>
                    {benefits.map((label) => (
                      <div
                        key={label}
                        className='text-muted-foreground flex items-center gap-2.5 text-sm'
                      >
                        <Check className='text-primary h-3.5 w-3.5 shrink-0' />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className='w-full rounded-lg'
                    variant={isPopular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link
                      to={isAuthenticated ? '/my-subscriptions' : '/sign-up'}
                    >
                      {isAuthenticated ? t('Subscribe Now') : t('Get Started')}
                      <ArrowRight className='ml-1 size-3.5' />
                    </Link>
                  </Button>
                </div>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
