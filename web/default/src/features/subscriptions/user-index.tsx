import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { useTopupInfo } from '@/features/wallet/hooks'
import { SubscriptionPlansCard } from '@/features/wallet/components/subscription-plans-card'

export function UserSubscriptions() {
  const { t } = useTranslation()
  const { topupInfo } = useTopupInfo()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('My Subscriptions')}</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Manage your subscriptions and billing preferences')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
          <SubscriptionPlansCard topupInfo={topupInfo} />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
