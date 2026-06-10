import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { useTopupInfo } from '@/features/wallet/hooks'
import { SubscriptionPlansCard } from '@/features/wallet/components/subscription-plans-card'
import { getSelf } from '@/lib/api'
import type { UserWalletData } from '@/features/wallet/types'

export function UserSubscriptions() {
  const { t } = useTranslation()
  const { topupInfo } = useTopupInfo()
  const [user, setUser] = useState<UserWalletData | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('My Subscriptions')}</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Manage your subscriptions and billing preferences')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
          <SubscriptionPlansCard
            topupInfo={topupInfo}
            userQuota={user?.quota}
            onPurchaseSuccess={fetchUser}
          />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
