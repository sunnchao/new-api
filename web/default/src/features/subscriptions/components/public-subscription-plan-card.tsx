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
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import {
  ArrowRight,
  Check,
  Clock,
  Layers,
  ListTree,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrencyUSD, formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GroupBadge } from '@/components/group-badge'
import { StatusBadge } from '@/components/status-badge'
import {
  formatBillingMode,
  formatDuration,
  formatResetPeriod,
  formatSubscriptionQuotaLimitSummary,
  formatSubscriptionTotalValue,
} from '../lib'
import {
  getPublicPlanCardAction,
  type PublicPlanCardMode,
} from '../lib/public-plan-card'
import { parseAllowedGroups } from '../lib/public-plan-models'
import type { PlanRecord, SubscriptionPlan } from '../types'
import { PublicPlanModelsDialog } from './public-plan-models-dialog'

export type PublicSubscriptionPlanCardMode = PublicPlanCardMode

export type PublicSubscriptionPlanCardActionOverride = {
  labelKey: string
  onClick?: () => void
  disabled?: boolean
  disabledTooltip?: string
}

type PublicSubscriptionPlanCardProps = {
  record: PlanRecord
  isAuthenticated: boolean
  featured?: boolean
  mode?: PublicSubscriptionPlanCardMode
  actionOverride?: PublicSubscriptionPlanCardActionOverride
}

function getTotalLabel(plan: SubscriptionPlan, t: TFunction) {
  const total = Number(plan.total_amount || 0)
  if (total <= 0) return t('Unlimited')
  return formatSubscriptionTotalValue(total, plan, t, formatQuota, {
    approximateTimes: plan.approximate_times,
  })
}

export function PublicSubscriptionPlanCard({
  record,
  isAuthenticated,
  featured = false,
  mode = 'catalog',
  actionOverride,
}: PublicSubscriptionPlanCardProps) {
  const { t } = useTranslation()
  const [modelsOpen, setModelsOpen] = useState(false)
  const plan = record.plan
  const allowedGroups = parseAllowedGroups(plan.allowed_groups)
  const limitSummary = formatSubscriptionQuotaLimitSummary(
    plan,
    t,
    formatQuota,
    { maxItems: mode === 'home' ? 2 : 4, includeMode: false }
  )
  const resetPeriod = formatResetPeriod(plan, t)
  const purchaseLimit = Number(plan.max_purchase_per_user || 0)
  const isHome = mode === 'home'
  const action = getPublicPlanCardAction({ mode, isAuthenticated })

  const highlights = [
    {
      icon: Clock,
      label: t('Validity Period'),
      value: formatDuration(plan, t),
    },
    {
      icon: Layers,
      label: t('Billing Mode'),
      value: formatBillingMode(plan.billing_mode, t),
    },
    {
      icon: ShieldCheck,
      label: t('Total Quota'),
      value: getTotalLabel(plan, t),
    },
  ]

  const details = [
    resetPeriod !== t('No Reset')
      ? `${t('Quota Reset')}: ${resetPeriod}`
      : null,
    limitSummary !== t('No Limits')
      ? `${t('Quota Limits')}: ${limitSummary}`
      : null,
    plan.upgrade_group ? `${t('Upgrade Group')}: ${plan.upgrade_group}` : null,
    purchaseLimit > 0 ? `${t('Purchase Limit')}: ${purchaseLimit}` : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <Card
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-lg border-border/70 bg-background/95 shadow-sm transition-shadow hover:shadow-md',
          featured && 'border-primary/50 shadow-md'
        )}
      >
        <CardHeader className='space-y-4'>
          <div className='flex min-w-0 items-start justify-between gap-3'>
            <div className='min-w-0'>
              <CardTitle className='truncate text-xl'>{plan.title}</CardTitle>
              {plan.subtitle ? (
                <p className='text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed'>
                  {plan.subtitle}
                </p>
              ) : null}
            </div>
            {featured ? (
              <StatusBadge variant='info' copyable={false}>
                {t('Recommended')}
              </StatusBadge>
            ) : null}
          </div>

          <div className='flex min-w-0 flex-wrap items-end gap-2'>
            <span className='text-primary break-words text-3xl font-bold tracking-tight'>
              {formatCurrencyUSD(Number(plan.price_amount || 0))}
            </span>
            {/* <span className='text-muted-foreground pb-1 text-xs font-medium uppercase'>
              {plan.currency || 'USD'}
            </span> */}
          </div>
        </CardHeader>

        <CardContent
          className={cn('flex-1 space-y-5', isHome && 'space-y-4')}
        >
          <div className='grid gap-2.5'>
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className='flex items-start gap-3 rounded-md border bg-muted/20 p-3'
                >
                  <Icon className='text-primary mt-0.5 size-4 shrink-0' />
                  <div className='min-w-0'>
                    <div className='text-muted-foreground text-xs'>
                      {item.label}
                    </div>
                    <div className='mt-0.5 break-words text-sm font-medium'>
                      {item.value}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {allowedGroups.length > 0 ? (
            <div className='space-y-2'>
              <div className='flex flex-wrap items-center gap-1.5'>
                <span className='text-muted-foreground mr-1 text-xs font-medium'>
                  {t('Allowed Groups')}
                </span>
                {allowedGroups.map((group) => (
                  <GroupBadge key={group} group={group} size='sm' />
                ))}
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='w-fit'
                onClick={() => setModelsOpen(true)}
              >
                <ListTree className='size-3.5' />
                {t('View all models')}
              </Button>
            </div>
          ) : null}

          {details.length > 0 ? (
            <div className='space-y-2'>
              {details.map((detail) => (
                <div key={detail} className='flex gap-2 text-sm leading-relaxed'>
                  <Check className='text-primary mt-0.5 size-4 shrink-0' />
                  <span className='text-muted-foreground break-words'>
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          ) : allowedGroups.length === 0 ? (
            <Badge variant='outline' className='w-fit'>
              {t('No Limits')}
            </Badge>
          ) : null}
        </CardContent>

        <CardFooter>
          {actionOverride ? (
            actionOverride.disabled && actionOverride.disabledTooltip ? (
              <Tooltip>
                <TooltipTrigger render={<div className='w-full' />}>
                  <Button
                    type='button'
                    className='h-9 w-full min-w-0'
                    variant={isHome && !featured ? 'outline' : 'default'}
                    disabled
                  >
                    <span className='min-w-0 truncate'>
                      {t(actionOverride.labelKey)}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {actionOverride.disabledTooltip}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type='button'
                className='h-9 w-full min-w-0'
                variant={isHome && !featured ? 'outline' : 'default'}
                onClick={actionOverride.onClick}
                disabled={actionOverride.disabled}
              >
                <span className='min-w-0 truncate'>
                  {t(actionOverride.labelKey)}
                </span>
                {!actionOverride.disabled ? (
                  <ArrowRight className='size-4 shrink-0' />
                ) : null}
              </Button>
            )
          ) : (
            <Button
              className='h-9 w-full min-w-0'
              variant={isHome && !featured ? 'outline' : 'outline'}
              render={<Link to={action.to} />}
            >
              <span className='min-w-0 truncate'>{t(action.labelKey)}</span>
              <ArrowRight className='size-4 shrink-0' />
            </Button>
          )}
        </CardFooter>
      </Card>

      {allowedGroups.length > 0 ? (
        <PublicPlanModelsDialog
          open={modelsOpen}
          onOpenChange={setModelsOpen}
          title={plan.title || t('Plan')}
          groups={allowedGroups}
        />
      ) : null}
    </>
  )
}
