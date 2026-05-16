import { useTranslation } from 'react-i18next'
import { GroupBadge } from '@/components/group-badge'
import type { GroupPriceDisplay } from '../lib/group-price'

function BillingTypeLabel() {
  const { t } = useTranslation()

  return (
    <span className='inline-flex rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-500/20 dark:text-teal-300'>
      {t('Per Request')}
    </span>
  )
}

export function DynamicRequestGroupPricingSection(props: {
  usableGroup: Record<string, { desc: string; ratio: number }>
  row: GroupPriceDisplay
}) {
  const { t } = useTranslation()

  if (props.row.billingType !== 'request') return null

  const groupInfo = props.usableGroup[props.row.group]
  const groupLabel = groupInfo?.desc || props.row.group

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='bg-muted/20 flex items-center justify-between gap-3 border-b px-3 py-2'>
        <div className='flex items-center gap-2'>
          <GroupBadge group={props.row.group} label={groupLabel} size='sm' />
          <BillingTypeLabel />
        </div>
        <span className='text-muted-foreground font-mono text-xs'>
          {props.row.ratio}x
        </span>
      </div>
      <div className='px-3 py-2.5 text-right'>
        <div className='space-y-1'>
          {props.row.items.map((item) => (
            <div key={item.key}>
              <div className='text-foreground font-mono text-sm font-semibold'>
                <span className='text-muted-foreground mr-1 font-sans font-normal'>
                  {t(item.labelKey)}
                </span>
                {item.value}
              </div>
              {(item.suffix || item.suffixKey) && (
                <div className='text-muted-foreground/50 text-xs'>
                  {item.suffixKey ? t(item.suffixKey) : item.suffix}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
