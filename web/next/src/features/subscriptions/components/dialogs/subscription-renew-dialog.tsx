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
import { CalendarClock, Crown, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  renewPayBalance,
  renewPayCreem,
  renewPayStripe,
} from '../../api'
import { formatDuration, formatResetPeriod } from '../../lib'
import type { PlanRecord, UserSubscriptionRecord } from '../../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: UserSubscriptionRecord | null
  plan: PlanRecord | null
  enableStripe?: boolean
  enableCreem?: boolean
  enableBalancePay?: boolean
  onRenewSuccess?: () => void
}

export function SubscriptionRenewDialog(props: Props) {
  const { t } = useTranslation()
  const [paying, setPaying] = useState(false)

  const plan = props.plan?.plan
  const sub = props.subscription?.subscription
  if (!plan || !sub) return null

  const hasStripe = props.enableStripe && !!plan.stripe_price_id
  const hasCreem = props.enableCreem && !!plan.creem_product_id
  const hasBalance = props.enableBalancePay !== false
  const hasAnyPayment = hasStripe || hasCreem || hasBalance
  const price = Number(plan.price_amount || 0).toFixed(2)
  const subId = sub.id

  const handlePayStripe = async () => {
    if (!subId) return
    setPaying(true)
    try {
      const res = await renewPayStripe({ user_subscription_id: subId })
      if (res.message === 'success' && res.data?.pay_link) {
        window.open(res.data.pay_link, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayCreem = async () => {
    if (!subId) return
    setPaying(true)
    try {
      const res = await renewPayCreem({ user_subscription_id: subId })
      if (res.message === 'success' && res.data?.checkout_url) {
        window.open(res.data.checkout_url, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayBalance = async () => {
    if (!subId) return
    setPaying(true)
    try {
      const res = await renewPayBalance({ user_subscription_id: subId })
      if (res.message === 'success') {
        toast.success(t('Renewal successful'))
        props.onRenewSuccess?.()
        props.onOpenChange(false)
      } else {
        const errMsg =
          typeof res.data === 'string'
            ? res.data
            : res.message && res.message !== 'success'
              ? res.message
              : t('Payment request failed')
        toast.error(errMsg)
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5' />
            {t('Renew Subscription')}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3 sm:space-y-4'>
          <div className='bg-muted/50 space-y-2.5 rounded-lg border p-3 sm:space-y-3 sm:p-4'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Plan Name')}
              </span>
              <span className='max-w-[200px] truncate text-sm font-medium'>
                {plan.title}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Subscription ID')}
              </span>
              <span className='text-sm'>#{subId}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Validity Period')}
              </span>
              <span className='flex items-center gap-1 text-sm'>
                <CalendarClock className='h-3.5 w-3.5' />
                {formatDuration(plan, t)}
              </span>
            </div>
            {formatResetPeriod(plan, t) !== t('No Reset') && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('Reset Period')}
                </span>
                <span className='text-sm'>{formatResetPeriod(plan, t)}</span>
              </div>
            )}
            <Separator />
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>{t('Amount Due')}</span>
              <span className='text-primary text-lg font-bold'>${price}</span>
            </div>
          </div>

          {hasAnyPayment ? (
            <div className='space-y-3'>
              <p className='text-muted-foreground text-xs'>
                {t('Select payment method')}
              </p>
              <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
                {hasBalance && (
                  <Button
                    className='flex-1'
                    onClick={handlePayBalance}
                    disabled={paying}
                  >
                    <Wallet className='mr-1 h-4 w-4' />
                    {t('Balance Pay')}
                  </Button>
                )}
                {hasStripe && (
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={handlePayStripe}
                    disabled={paying}
                  >
                    Stripe
                  </Button>
                )}
                {hasCreem && (
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={handlePayCreem}
                    disabled={paying}
                  >
                    Creem
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground text-center text-sm'>
              {t('No payment method available')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
