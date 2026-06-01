/*
Copyright (C) 2025 QuantumNous

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
'use client'

import './i18n'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useIsAdmin } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/empty-state'
import { SubscriptionsTab } from './components/subscriptions-tab'
import { PlansTab } from './components/plans-tab'
import { GrantSubscriptionDialog } from './components/grant-subscription-dialog'

export function AdminPackagesPage() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const [grantOpen, setGrantOpen] = useState(false)

  if (!isAdmin) {
    return (
      <div className='p-6'>
        <EmptyState
          title={t('Permission denied')}
          description={t('This page is only available to administrators')}
        />
      </div>
    )
  }

  return (
    <div className='space-y-4 p-4 sm:p-6'>
      <div className='flex items-center justify-between gap-2'>
        <h1 className='text-xl font-semibold'>{t('Package Management')}</h1>
        <Button size='sm' onClick={() => setGrantOpen(true)}>
          <Plus className='mr-2 size-4' />
          {t('Grant Subscription')}
        </Button>
      </div>

      <Tabs defaultValue='subscriptions'>
        <TabsList>
          <TabsTrigger value='subscriptions'>{t('Subscriptions')}</TabsTrigger>
          <TabsTrigger value='plans'>{t('Plans')}</TabsTrigger>
        </TabsList>
        <TabsContent value='subscriptions' className='mt-4'>
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value='plans' className='mt-4'>
          <PlansTab />
        </TabsContent>
      </Tabs>

      <GrantSubscriptionDialog open={grantOpen} onOpenChange={setGrantOpen} />
    </div>
  )
}
