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
import { Info } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionPageLayout } from '@/components/layout'
import { AllSubscriptionsTable } from './components/all-subscriptions-table'
import { SubscriptionsDialogs } from './components/subscriptions-dialogs'
import { SubscriptionsPrimaryButtons } from './components/subscriptions-primary-buttons'
import { SubscriptionsProvider } from './components/subscriptions-provider'
import { SubscriptionsTable } from './components/subscriptions-table'

export function Subscriptions() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab =
    searchParams.get('tab') === 'all-subscriptions'
      ? 'all-subscriptions'
      : 'plans'

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all-subscriptions') {
      params.set('tab', value)
    } else {
      params.delete('tab')
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }

  return (
    <SubscriptionsProvider>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          {t('Subscription Management')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t('Manage subscription plan creation, pricing and status')}
        </SectionPageLayout.Description>
        <SectionPageLayout.Actions>
          {activeTab === 'plans' && (
            <div className='flex items-center gap-2'>
              <Alert variant='default' className='hidden px-3 py-2 sm:flex'>
                <Info className='h-4 w-4' />
                <AlertDescription className='text-xs'>
                  {t(
                    'Stripe/Creem requires creating products on the third-party platform and entering the ID'
                  )}
                </AlertDescription>
              </Alert>
              <SubscriptionsPrimaryButtons />
            </div>
          )}
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value='plans'>{t('Plans')}</TabsTrigger>
              <TabsTrigger value='all-subscriptions'>
                {t('All Subscriptions')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value='plans' className='mt-4'>
              <SubscriptionsTable />
            </TabsContent>
            <TabsContent value='all-subscriptions' className='mt-4'>
              <AllSubscriptionsTable />
            </TabsContent>
          </Tabs>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <SubscriptionsDialogs />
    </SubscriptionsProvider>
  )
}
