import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GroupBadge } from '@/components/group-badge'
import { getGroupPriceDisplay } from '../lib/group-price'
import { getAvailableGroups } from '../lib/model-helpers'
import type { PricingModel, TokenUnit } from '../types'

function SectionTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>
      {props.children}
    </h2>
  )
}

function AutoGroupChain(props: { model: PricingModel; autoGroups: string[] }) {
  const { t } = useTranslation()
  const modelEnableGroups = Array.isArray(props.model.enable_groups)
    ? props.model.enable_groups
    : []
  const autoChain = props.autoGroups.filter((g) =>
    modelEnableGroups.includes(g)
  )

  if (autoChain.length === 0) return null

  return (
    <div className='text-muted-foreground mb-3 flex flex-wrap items-center gap-1 text-xs'>
      <span className='font-medium'>{t('Auto Group Chain')}</span>
      <span className='text-muted-foreground/40'>→</span>
      {autoChain.map((group, index) => (
        <span key={group} className='flex items-center gap-1'>
          <GroupBadge group={group} size='sm' />
          {index < autoChain.length - 1 && (
            <span className='text-muted-foreground/40'>→</span>
          )}
        </span>
      ))}
    </div>
  )
}

function BillingTypeLabel(props: { type: 'dynamic' | 'token' | 'request' }) {
  const { t } = useTranslation()
  const labels = {
    dynamic: t('Dynamic Pricing'),
    token: t('Token-based'),
    request: t('Per Request'),
  }
  const classNames = {
    dynamic:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    token:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    request: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  }

  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${classNames[props.type]}`}
    >
      {labels[props.type]}
    </span>
  )
}

export type GroupPricingSectionProps = {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}

export function GroupPricingSection(props: GroupPricingSectionProps) {
  const { t } = useTranslation()
  const {
    model,
    groupRatio,
    usableGroup,
    autoGroups,
    priceRate,
    usdExchangeRate,
    tokenUnit,
    showRechargePrice = false,
  } = props

  const availableGroups = useMemo(
    () => getAvailableGroups(model, usableGroup || {}),
    [model, usableGroup]
  )

  const groupPriceRows = useMemo(
    () =>
      availableGroups.map((group) =>
        getGroupPriceDisplay({
          model,
          group,
          groupRatio,
          tokenUnit,
          showWithRecharge: showRechargePrice,
          priceRate,
          usdExchangeRate,
        })
      ),
    [
      availableGroups,
      groupRatio,
      model,
      priceRate,
      showRechargePrice,
      tokenUnit,
      usdExchangeRate,
    ]
  )

  if (availableGroups.length === 0) {
    return (
      <section className='py-4'>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={model} autoGroups={autoGroups} />
        <p className='text-muted-foreground text-sm'>
          {t(
            'This model is not available in any group, or no group pricing information is configured.'
          )}
        </p>
      </section>
    )
  }

  const thClass =
    'text-muted-foreground py-2 text-[10px] font-medium tracking-wider uppercase'

  return (
    <section className='py-4'>
      <SectionTitle>{t('Pricing by Group')}</SectionTitle>
      <AutoGroupChain model={model} autoGroups={autoGroups} />
      <div className='-mx-4 sm:mx-0'>
        <Table className='text-sm'>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className={thClass}>{t('Group')}</TableHead>
              <TableHead className={thClass}>{t('Ratio')}</TableHead>
              <TableHead className={thClass}>{t('Billing Type')}</TableHead>
              <TableHead className={`${thClass} text-right`}>
                {t('Pricing Summary')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupPriceRows.map((row) => {
              const groupInfo = usableGroup[row.group]
              const groupLabel = groupInfo?.desc || row.group
              return (
                <TableRow key={row.group}>
                  <TableCell className='py-2.5'>
                    <GroupBadge
                      group={row.group}
                      label={groupLabel}
                      size='sm'
                    />
                  </TableCell>
                  <TableCell className='text-muted-foreground py-2.5 font-mono text-xs'>
                    {row.ratio}x
                  </TableCell>
                  <TableCell className='py-2.5'>
                    <BillingTypeLabel type={row.billingType} />
                  </TableCell>
                  <TableCell className='py-2.5 text-right align-top'>
                    {row.items.length === 1 && row.items[0].isDynamic ? (
                      <span className='text-muted-foreground text-sm'>
                        {t(row.items[0].suffixKey || row.items[0].labelKey)}
                      </span>
                    ) : (
                      <div className='space-y-1'>
                        {row.items.map((item) => (
                          <div key={item.key}>
                            <div className='text-foreground font-mono text-sm font-semibold'>
                              <span className='text-muted-foreground mr-1 font-sans font-normal'>
                                {t(item.labelKey)}
                              </span>
                              {item.value}
                            </div>
                            {(item.suffix || item.suffixKey) && (
                              <div className='text-muted-foreground/50 text-xs'>
                                {item.suffixKey
                                  ? t(item.suffixKey)
                                  : item.suffix}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
