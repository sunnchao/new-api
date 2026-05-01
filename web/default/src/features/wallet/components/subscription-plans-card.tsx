import { useState, useEffect, useMemo, useCallback } from 'react'
import { Crown, RefreshCw, Sparkles, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  StatusBadge,
  dotColorMap,
  textColorMap,
} from '@/components/status-badge'
import {
  getPublicPlans,
  getSelfSubscriptionFull,
  updateBillingPreference,
} from '@/features/subscriptions/api'
import { SubscriptionPurchaseDialog } from '@/features/subscriptions/components/dialogs/subscription-purchase-dialog'
import {
  formatDuration,
  formatResetPeriod,
  formatBillingMode,
} from '@/features/subscriptions/lib'
import type {
  PlanRecord,
  UserSubscriptionRecord,
} from '@/features/subscriptions/types'
import type { PaymentMethod, TopupInfo } from '../types'

interface SubscriptionPlansCardProps {
  topupInfo: TopupInfo | null
  onAvailabilityChange?: (available: boolean) => void
}

function getEpayMethods(payMethods: PaymentMethod[] = []): PaymentMethod[] {
  return payMethods.filter(
    (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem'
  )
}

export function SubscriptionPlansCard({
  topupInfo,
  onAvailabilityChange,
}: SubscriptionPlansCardProps) {
  const { t } = useTranslation()
  const { status } = useStatus()

  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [allSubscriptions, setAllSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [billingPreference, setBillingPreference] =
    useState('subscription_first')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null)

  const enableStripe = !!status?.enable_stripe_topup
  const enableCreem = !!topupInfo?.enable_creem_topup
  const enableOnlineTopUp = !!status?.enable_online_topup
  const epayMethods = useMemo(
    () => getEpayMethods(topupInfo?.pay_methods),
    [topupInfo?.pay_methods]
  )

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPublicPlans()
      if (res.success) {
        setPlans(res.data || [])
      }
    } catch {
      setPlans([])
    }
  }, [])

  const fetchSelfSubscription = useCallback(async () => {
    try {
      const res = await getSelfSubscriptionFull()
      if (res.success && res.data) {
        setBillingPreference(
          res.data.billing_preference || 'subscription_first'
        )
        setActiveSubscriptions(res.data.subscriptions || [])
        setAllSubscriptions(res.data.all_subscriptions || [])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchPlans(), fetchSelfSubscription()])
      setLoading(false)
    }
    init()
  }, [fetchPlans, fetchSelfSubscription])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchSelfSubscription()
    } finally {
      setRefreshing(false)
    }
  }

  const handlePreferenceChange = async (pref: string) => {
    const previous = billingPreference
    setBillingPreference(pref)
    try {
      const res = await updateBillingPreference(pref)
      if (res.success) {
        toast.success(t('Updated successfully'))
        const normalized = res.data?.billing_preference || pref
        setBillingPreference(normalized)
      } else {
        toast.error(res.message || t('Update failed'))
        setBillingPreference(previous)
      }
    } catch {
      toast.error(t('Request failed'))
      setBillingPreference(previous)
    }
  }

  const hasActive = activeSubscriptions.length > 0
  const hasAny = allSubscriptions.length > 0
  const isAvailable = loading || plans.length > 0 || hasAny
  const disablePref = !hasActive
  const isSubPref =
    billingPreference === 'subscription_first' ||
    billingPreference === 'subscription_only'
  const displayPref =
    disablePref && isSubPref ? 'wallet_first' : billingPreference

  const planPurchaseCountMap = useMemo(() => {
    const map = new Map<number, number>()
    for (const sub of allSubscriptions) {
      const planId = sub?.subscription?.plan_id
      if (!planId) continue
      map.set(planId, (map.get(planId) || 0) + 1)
    }
    return map
  }, [allSubscriptions])

  useEffect(() => {
    onAvailabilityChange?.(isAvailable)
  }, [isAvailable, onAvailabilityChange])

  const planTitleMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of plans) {
      if (p?.plan?.id) {
        map.set(p.plan.id, p.plan.title || '')
      }
    }
    return map
  }, [plans])

  const getRemainingDays = (sub: UserSubscriptionRecord) => {
    const endTime = sub?.subscription?.end_time || 0
    if (!endTime) return 0
    const now = Date.now() / 1000
    return Math.max(0, Math.ceil((endTime - now) / 86400))
  }

  const getUsagePercent = (sub: UserSubscriptionRecord) => {
    const total = Number(sub?.subscription?.amount_total || 0)
    const used = Number(sub?.subscription?.amount_used || 0)
    if (total <= 0) return 0
    return Math.round((used / total) * 100)
  }

  if (loading) {
    return (
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent className='space-y-4 p-3 sm:p-5'>
          <Skeleton className='h-20 w-full' />
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-48 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (plans.length === 0 && !hasAny) {
    return (
      <Card className='overflow-hidden'>
        <CardHeader className='border-b'>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
              <Crown className='h-4 w-4' />
            </div>
            <div className='min-w-0'>
              <CardTitle className='text-xl tracking-tight'>
                {t('Subscription Plans')}
              </CardTitle>
              <CardDescription>
                {t('Purchase a plan to enjoy model benefits')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <p className='text-muted-foreground py-8 text-center text-sm'>
            {t('No plans available')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <TitledCard
        title={t('Subscription Plans')}
        description={t('Purchase a plan to enjoy model benefits')}
        icon={<Crown className='h-4 w-4' />}
        contentClassName='space-y-4 sm:space-y-5'
      >
        {/* My subscriptions & billing preference */}
        <div className='rounded-xl border p-3 sm:p-4'>
          <div className='flex flex-wrap items-center justify-between gap-2.5 sm:gap-3'>
            <div className='flex min-w-0 flex-wrap items-center gap-2'>
              <span className='text-sm font-medium'>
                {t('My Subscriptions')}
              </span>
              <span className='flex items-center gap-1.5 text-xs font-medium'>
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    hasActive ? dotColorMap.success : dotColorMap.neutral
                  )}
                  aria-hidden='true'
                />
                {hasActive ? (
                  <span className={cn(textColorMap.success)}>
                    {activeSubscriptions.length} {t('active')}
                  </span>
                ) : (
                  <span className='text-muted-foreground'>
                    {t('No Active')}
                  </span>
                )}
                {allSubscriptions.length > activeSubscriptions.length && (
                  <>
                    <span className='text-muted-foreground/30'>·</span>
                    <span className='text-muted-foreground'>
                      {allSubscriptions.length - activeSubscriptions.length}{' '}
                      {t('expired')}
                    </span>
                  </>
                )}
              </span>
            </div>
            <div className='flex w-full items-center gap-2 sm:w-auto'>
              <Select
                value={displayPref}
                onValueChange={handlePreferenceChange}
              >
                <SelectTrigger className='h-8 flex-1 text-xs sm:w-[140px] sm:flex-none'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='subscription_first' disabled={disablePref}>
                    {t('Subscription First')}
                    {disablePref ? ` (${t('No Active')})` : ''}
                  </SelectItem>
                  <SelectItem value='wallet_first'>
                    {t('Wallet First')}
                  </SelectItem>
                  <SelectItem value='subscription_only' disabled={disablePref}>
                    {t('Subscription Only')}
                    {disablePref ? ` (${t('No Active')})` : ''}
                  </SelectItem>
                  <SelectItem value='wallet_only'>
                    {t('Wallet Only')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>

          {disablePref && isSubPref && (
            <p className='text-muted-foreground mt-2 text-xs'>
              {t(
                'Preference saved as {{pref}}, but no active subscription. Wallet will be used automatically.',
                {
                  pref:
                    billingPreference === 'subscription_only'
                      ? t('Subscription Only')
                      : t('Subscription First'),
                }
              )}
            </p>
          )}

          {hasAny && (
            <>
              <Separator className='my-3' />
              <div className='max-h-64 space-y-3 overflow-y-auto pr-1'>
                {allSubscriptions.map((sub) => {
                  const subscription = sub.subscription
                  const totalAmount = Number(subscription?.amount_total || 0)
                  const usedAmount = Number(subscription?.amount_used || 0)
                  const remainAmount =
                    totalAmount > 0 ? Math.max(0, totalAmount - usedAmount) : 0
                  const planTitle =
                    planTitleMap.get(subscription?.plan_id) || ''
                  const remainDays = getRemainingDays(sub)
                  const usagePercent = getUsagePercent(sub)
                  const now = Date.now() / 1000
                  const isExpired = (subscription?.end_time || 0) < now
                  const isCancelled = subscription?.status === 'cancelled'
                  const isActive =
                    subscription?.status === 'active' && !isExpired
                  const allowedGroups = subscription?.allowed_groups
                    ?.split(',')
                    .map((g) => g.trim())
                    .filter(Boolean)

                  return (
                    <div
                      key={subscription?.id}
                      className='bg-background rounded-md border p-3 text-xs'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>
                            {planTitle
                              ? `${planTitle} · ${t('Subscription')} #${subscription?.id}`
                              : `${t('Subscription')} #${subscription?.id}`}
                          </span>
                          {isActive ? (
                            <StatusBadge
                              label={t('Active')}
                              variant='success'
                              copyable={false}
                            />
                          ) : isCancelled ? (
                            <StatusBadge
                              label={t('Cancelled')}
                              variant='neutral'
                              copyable={false}
                            />
                          ) : (
                            <StatusBadge
                              label={t('Expired')}
                              variant='neutral'
                              copyable={false}
                            />
                          )}
                          <StatusBadge
                            label={formatBillingMode(
                              subscription?.billing_mode,
                              t
                            )}
                            variant='neutral'
                            copyable={false}
                          />
                          {subscription?.source && (
                            <StatusBadge
                              label={
                                subscription.source === 'admin'
                                  ? t('Admin Assigned')
                                  : t('Self Purchased')
                              }
                              variant='neutral'
                              copyable={false}
                            />
                          )}
                        </div>
                        {isActive && (
                          <span className='text-muted-foreground'>
                            {t('{{count}} days remaining', {
                              count: remainDays,
                            })}
                          </span>
                        )}
                      </div>
                      <div className='text-muted-foreground mt-1.5'>
                        {isActive
                          ? t('Until')
                          : isCancelled
                            ? t('Cancelled at')
                            : t('Expired at')}{' '}
                        {new Date(
                          (subscription?.end_time || 0) * 1000
                        ).toLocaleString()}
                      </div>
                      {isActive && (subscription?.next_reset_time ?? 0) > 0 && (
                        <div className='text-muted-foreground mt-1'>
                          {t('Next reset')}:{' '}
                          {new Date(
                            subscription!.next_reset_time! * 1000
                          ).toLocaleString()}
                        </div>
                      )}
                      <div className='text-muted-foreground mt-1'>
                        {t('Allowed Groups')}:{' '}
                        {allowedGroups?.length
                          ? allowedGroups.join(', ')
                          : t('All Groups')}
                      </div>
                      {(() => {
                        const isRequest =
                          subscription?.billing_mode === 'request'
                        const fmt = (v: number) =>
                          isRequest
                            ? `${v.toLocaleString()}${t('times')}`
                            : formatQuota(v)
                        const approxSuffix = (n?: number) =>
                          !isRequest && n && n > 0
                            ? ` (${t('Approx.')} ${n.toLocaleString()}${t('times')})`
                            : ''
                        return (
                          <>
                            <div className='text-muted-foreground mt-1'>
                              {t('Total Quota')}:{' '}
                              {totalAmount > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className='cursor-help'>
                                      {fmt(usedAmount)}/{fmt(totalAmount)} ·{' '}
                                      {t('Remaining')} {fmt(remainAmount)}
                                      {approxSuffix(
                                        subscription?.approximate_times
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t('Raw Quota')}: {usedAmount}/{totalAmount}{' '}
                                    · {t('Remaining')} {remainAmount}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                t('Unlimited')
                              )}
                              {totalAmount > 0 && (
                                <span className='ml-2'>
                                  {t('Used')} {usagePercent}%
                                </span>
                              )}
                            </div>
                            {totalAmount > 0 && isActive && (
                              <Progress
                                value={usagePercent}
                                className='mt-2 h-1.5'
                              />
                            )}
                            {/* Rate limit usage (unified with admin overview spec) */}
                            {isActive &&
                              (() => {
                                const items: {
                                  key: string
                                  label: string
                                  used: number
                                  limit: number
                                  next: number
                                  approx?: number
                                }[] = []
                                if (
                                  (subscription?.hourly_limit_amount || 0) > 0
                                ) {
                                  items.push({
                                    key: 'hourly',
                                    label: `${t('Every')}${
                                      subscription?.hourly_limit_hours || 1
                                    }${t('hours')}`,
                                    used: subscription?.hourly_amount_used || 0,
                                    limit:
                                      subscription?.hourly_limit_amount || 0,
                                    next:
                                      subscription?.hourly_next_reset_time || 0,
                                    approx:
                                      subscription?.hourly_approximate_times,
                                  })
                                }
                                if (
                                  (subscription?.daily_limit_amount || 0) > 0
                                ) {
                                  items.push({
                                    key: 'daily',
                                    label: t('Daily'),
                                    used: subscription?.daily_amount_used || 0,
                                    limit:
                                      subscription?.daily_limit_amount || 0,
                                    next:
                                      subscription?.daily_next_reset_time || 0,
                                    approx:
                                      subscription?.daily_approximate_times,
                                  })
                                }
                                if (
                                  (subscription?.weekly_limit_amount || 0) > 0
                                ) {
                                  items.push({
                                    key: 'weekly',
                                    label: t('Weekly'),
                                    used: subscription?.weekly_amount_used || 0,
                                    limit:
                                      subscription?.weekly_limit_amount || 0,
                                    next:
                                      subscription?.weekly_next_reset_time || 0,
                                    approx:
                                      subscription?.weekly_approximate_times,
                                  })
                                }
                                if (
                                  (subscription?.monthly_limit_amount || 0) > 0
                                ) {
                                  items.push({
                                    key: 'monthly',
                                    label: t('Monthly'),
                                    used:
                                      subscription?.monthly_amount_used || 0,
                                    limit:
                                      subscription?.monthly_limit_amount || 0,
                                    next:
                                      subscription?.monthly_next_reset_time ||
                                      0,
                                    approx:
                                      subscription?.monthly_approximate_times,
                                  })
                                }
                                if (items.length === 0) return null
                                return (
                                  <div className='mt-2.5 space-y-1 border-t pt-2 text-[11px]'>
                                    <div className='text-muted-foreground font-medium'>
                                      {t('Quota Limits')}
                                    </div>
                                    <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2'>
                                      {items.map((l) => (
                                        <div key={l.key} className='min-w-0'>
                                          <div className='flex items-center justify-between gap-2'>
                                            <span className='text-muted-foreground shrink-0'>
                                              {l.label}
                                            </span>
                                            <span className='truncate'>
                                              {fmt(l.used)} / {fmt(l.limit)}
                                              {approxSuffix(l.approx)}
                                            </span>
                                          </div>
                                          {l.next > 0 && (
                                            <div className='text-muted-foreground/70 truncate'>
                                              {t('Next Reset')}{' '}
                                              {new Date(
                                                l.next * 1000
                                              ).toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })()}
                          </>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {!hasAny && (
            <p className='text-muted-foreground mt-2 text-xs'>
              {t('Purchase a plan to enjoy model benefits')}
            </p>
          )}
        </div>

        {/* Available plans grid */}
        {plans.length > 0 ? (
          <div className='grid grid-cols-1 gap-3 2xl:grid-cols-2 2xl:gap-4'>
            {plans.map((p, index) => {
              const plan = p?.plan
              if (!plan) return null
              const totalAmount = Number(plan.total_amount || 0)
              const price = Number(plan.price_amount || 0).toFixed(2)
              const isPopular = index === 0 && plans.length > 1
              const limit = Number(plan.max_purchase_per_user || 0)
              const count = planPurchaseCountMap.get(plan.id) || 0
              const reached = limit > 0 && count >= limit
              const allowedGroups = plan.allowed_groups
                ?.split(',')
                .map((g) => g.trim())
                .filter(Boolean)

              const isRequestPlan = plan.billing_mode === 'request'
              const fmtPlanAmount = (v: number) =>
                isRequestPlan
                  ? `${v.toLocaleString()}${t('times')}`
                  : formatQuota(v)
              const approxSuffix = (n?: number) =>
                !isRequestPlan && n && n > 0
                  ? ` (${t('Approx.')} ${n.toLocaleString()}${t('times')})`
                  : ''
              const rateLimitSummary = (() => {
                const parts: string[] = []
                if (plan.hourly_limit_amount && plan.hourly_limit_amount > 0) {
                  const hourLabel = `${t('Every')}${
                    plan.hourly_limit_hours || 1
                  }${t('hours')}`
                  parts.push(
                    `${hourLabel}: ${fmtPlanAmount(plan.hourly_limit_amount)}${approxSuffix(plan.hourly_approximate_times)}`
                  )
                }
                if (plan.daily_limit_amount && plan.daily_limit_amount > 0)
                  parts.push(
                    `${t('Daily')}: ${fmtPlanAmount(plan.daily_limit_amount)}${approxSuffix(plan.daily_approximate_times)}`
                  )
                if (plan.weekly_limit_amount && plan.weekly_limit_amount > 0)
                  parts.push(
                    `${t('Weekly')}: ${fmtPlanAmount(plan.weekly_limit_amount)}${approxSuffix(plan.weekly_approximate_times)}`
                  )
                if (plan.monthly_limit_amount && plan.monthly_limit_amount > 0)
                  parts.push(
                    `${t('Monthly')}: ${fmtPlanAmount(plan.monthly_limit_amount)}${approxSuffix(plan.monthly_approximate_times)}`
                  )
                return parts.length > 0
                  ? `${t('Quota Limits')}: ${parts.join(' / ')}`
                  : null
              })()

              const benefits = [
                `${t('Validity Period')}: ${formatDuration(plan, t)}`,
                `${t('Billing Mode')}: ${formatBillingMode(plan.billing_mode, t)}`,
                formatResetPeriod(plan, t) !== t('No Reset')
                  ? `${t('Quota Reset')}: ${formatResetPeriod(plan, t)}`
                  : null,
                totalAmount > 0
                  ? `${t('Total Quota')}: ${fmtPlanAmount(totalAmount)}${approxSuffix(plan.approximate_times)}`
                  : `${t('Total Quota')}: ${t('Unlimited')}`,
                allowedGroups?.length
                  ? `${t('Allowed Groups')}: ${allowedGroups.join(', ')}`
                  : `${t('Allowed Groups')}: ${t('All Groups')}`,
                limit > 0 ? `${t('Purchase Limit')}: ${limit}` : null,
                plan.upgrade_group
                  ? `${t('Upgrade Group')}: ${plan.upgrade_group}`
                  : null,
                rateLimitSummary,
              ].filter(Boolean) as string[]

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'transition-shadow hover:shadow-md',
                    isPopular && 'border-primary/70 shadow-sm'
                  )}
                >
                  <CardContent className='flex h-full flex-col p-3.5 sm:p-4'>
                    <div className='mb-2 flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h4 className='truncate font-semibold'>
                          {plan.title || t('Subscription Plans')}
                        </h4>
                        {plan.subtitle && (
                          <p className='text-muted-foreground truncate text-xs'>
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

                    <div className='py-2'>
                      <span className='text-primary text-2xl font-bold'>
                        ${price}
                      </span>
                    </div>

                    <div className='flex-1 space-y-1.5 pb-3'>
                      {benefits.map((label) => (
                        <div
                          key={label}
                          className='text-muted-foreground flex items-center gap-2 text-xs'
                        >
                          <Check className='text-primary h-3 w-3 shrink-0' />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className='mb-3' />

                    {reached ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant='outline'
                              className='w-full'
                              disabled
                            >
                              {t('Limit Reached')}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('Purchase limit reached')} ({count}/{limit})
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={() => {
                          setSelectedPlan(p)
                          setPurchaseOpen(true)
                        }}
                      >
                        {t('Subscribe Now')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className='text-muted-foreground py-4 text-center text-sm'>
            {t('No plans available')}
          </p>
        )}
      </TitledCard>

      <SubscriptionPurchaseDialog
        open={purchaseOpen}
        onOpenChange={(open) => {
          setPurchaseOpen(open)
          if (!open) {
            fetchSelfSubscription()
          }
        }}
        onPaymentSuccess={fetchSelfSubscription}
        plan={selectedPlan}
        enableStripe={enableStripe}
        enableCreem={enableCreem}
        enableOnlineTopUp={enableOnlineTopUp}
        epayMethods={epayMethods}
        purchaseLimit={
          selectedPlan?.plan?.max_purchase_per_user
            ? Number(selectedPlan.plan.max_purchase_per_user)
            : undefined
        }
        purchaseCount={
          selectedPlan?.plan?.id
            ? planPurchaseCountMap.get(selectedPlan.plan.id)
            : undefined
        }
      />
    </>
  )
}
