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
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { PublicLayout } from '@/components/layout'
import { LoadingState } from '@/components/loading-state'
import { PageTransition } from '@/components/page-transition'

import { CampaignHero } from './components/campaign-hero'
import { CampaignRules } from './components/campaign-rules'
import { MyProgressCard } from './components/my-progress-card'
import { TierBoard } from './components/tier-board'
import { useTopupCampaign } from './hooks/use-topup-campaign'

export function TopupCampaignPage() {
  const { t } = useTranslation()
  const query = useTopupCampaign()
  const info = query.data

  let content: React.ReactNode
  if (query.isLoading) {
    content = <LoadingState className='py-24' />
  } else if (query.isError) {
    content = (
      <ErrorState
        title={t('Failed to load the campaign')}
        description={
          query.error instanceof Error ? query.error.message : undefined
        }
        onRetry={() => void query.refetch()}
      />
    )
  } else if (!info || !info.enabled || info.status === 'disabled') {
    content = (
      <EmptyState
        icon={Sparkles}
        title={t('The top-up campaign is not active')}
        description={t('Please come back later.')}
      />
    )
  } else {
    content = (
      <>
        <CampaignHero info={info} />
        <MyProgressCard info={info} />
        <TierBoard info={info} />
        <CampaignRules info={info} />
      </>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className='relative mx-auto w-full max-w-[1100px] space-y-6 px-3 pt-16 pb-12 sm:px-6 sm:pt-20 xl:px-8'>
        {content}
      </PageTransition>
    </PublicLayout>
  )
}
