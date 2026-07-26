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
import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Layers, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { GroupBadge } from '@/components/group-badge'
import { getPricing } from '@/features/pricing/api'
import type { PricingModel } from '@/features/pricing/types'
import {
  filterModelsByAllowedGroups,
  getSingleGroupPricingSearch,
} from '../lib/public-plan-models'

type PublicPlanModelsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  groups: string[]
}

function ModelRow(props: { model: PricingModel }) {
  const vendorIcon = props.model.vendor_icon
    ? getLobeIcon(props.model.vendor_icon, 22)
    : null
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'

  return (
    <Link
      to='/pricing/$modelId'
      params={{ modelId: props.model.model_name }}
      className='hover:bg-muted/40 flex min-w-0 items-center gap-3 rounded-md border p-3 transition-colors'
    >
      <span className='bg-muted/40 flex size-8 shrink-0 items-center justify-center rounded-md'>
        {vendorIcon || (
          <span className='text-muted-foreground text-xs font-bold'>
            {initial}
          </span>
        )}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate font-mono text-sm font-medium'>
          {props.model.model_name}
        </span>
        {props.model.vendor_name ? (
          <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
            {props.model.vendor_name}
          </span>
        ) : null}
      </span>
      <ExternalLink className='text-muted-foreground size-3.5 shrink-0' />
    </Link>
  )
}

export function PublicPlanModelsDialog(props: PublicPlanModelsDialogProps) {
  const { t } = useTranslation()
  const pricingSearch = getSingleGroupPricingSearch(props.groups)
  const pricingQuery = useQuery({
    queryKey: ['pricing'],
    queryFn: getPricing,
    staleTime: 5 * 60 * 1000,
    enabled: props.open && props.groups.length > 0,
  })

  const models = useMemo(() => {
    const data = pricingQuery.data
    if (!data?.data || !data?.vendors) return []

    const vendorMap = new Map(data.vendors.map((vendor) => [vendor.id, vendor]))
    const enriched = data.data.map((model) => {
      const vendor = model.vendor_id
        ? vendorMap.get(model.vendor_id)
        : undefined
      return {
        ...model,
        vendor_name: vendor?.name,
        vendor_icon: vendor?.icon,
        vendor_description: vendor?.description,
      }
    })

    return filterModelsByAllowedGroups(enriched, props.groups)
  }, [pricingQuery.data, props.groups])

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[90vh] max-sm:w-[calc(100vw-1.5rem)] sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Layers className='size-5' />
            {t('Supported Models')}
          </DialogTitle>
          <DialogDescription>
            {t('Models available for {{plan}}', { plan: props.title })}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-wrap gap-1.5'>
          {props.groups.map((group) => (
            <Link key={group} to='/pricing' search={{ group }} className='w-fit'>
              <GroupBadge group={group} />
            </Link>
          ))}
        </div>

        {pricingQuery.isLoading ? (
          <div className='grid gap-2'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className='h-[58px] rounded-md' />
            ))}
          </div>
        ) : pricingQuery.isError ? (
          <EmptyState
            bordered
            icon={RefreshCw}
            title={t('Unable to load supported models')}
            description={t('Please refresh the page and try again.')}
            className='min-h-[220px]'
          />
        ) : models.length === 0 ? (
          <EmptyState
            bordered
            icon={Layers}
            title={t('No supported models found')}
            description={t('No enabled models match these groups yet.')}
            className='min-h-[220px]'
          />
        ) : (
          <ScrollArea className='h-[46vh] pr-3'>
            <div className='grid gap-2'>
              {models.map((model) => (
                <ModelRow key={model.model_name} model={model} />
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {pricingSearch ? (
            <Button render={<Link to='/pricing' search={pricingSearch} />}>
              {t('View in Model Square')}
              <ExternalLink className='size-4' />
            </Button>
          ) : (
            <Button variant='outline' render={<Link to='/pricing' />}>
              {t('Open Model Square')}
              <ExternalLink className='size-4' />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
