import { FILTER_ALL } from '../constants'
import type { PriceType, PricingModel, TokenUnit } from '../types'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
  type DynamicPricingSummary,
} from './dynamic-price'
import {
  getDefaultRequestPriceDisplay,
  getGroupPriceDisplay,
  type GroupPriceDisplay,
} from './group-price'
import { formatGroupPrice, formatPrice } from './price'

export type ModelListPricingContextInput = {
  model: PricingModel
  groupFilter?: string
  tokenUnit: TokenUnit
  showWithRecharge?: boolean
  priceRate?: number
  usdExchangeRate?: number
  now?: Date
}

export type ModelListPricingContext = {
  model: PricingModel
  selectedGroup: string | null
  groupRatio: Record<string, number>
  tokenUnit: TokenUnit
  showWithRecharge: boolean
  priceRate: number
  usdExchangeRate: number
  requestPriceDisplay: GroupPriceDisplay | null
  dynamicSummary: DynamicPricingSummary | null
}

export function resolveModelListPricingGroup(
  model: PricingModel,
  groupFilter?: string
): string | null {
  const group = `${groupFilter || ''}`.trim()
  if (!group || group === FILTER_ALL) return null

  const enableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []
  return enableGroups.includes(group) ? group : null
}

function getSelectedGroupRatio(
  model: PricingModel,
  selectedGroup: string | null,
  groupRatio: Record<string, number>
): number {
  if (!selectedGroup) return getDynamicDisplayGroupRatio(model)

  const ratio = groupRatio[selectedGroup]
  return Number.isFinite(ratio) ? ratio : 1
}

export function getModelListPricingContext({
  model,
  groupFilter,
  tokenUnit,
  showWithRecharge = false,
  priceRate = 1,
  usdExchangeRate = 1,
  now = new Date(),
}: ModelListPricingContextInput): ModelListPricingContext {
  const groupRatio = model.group_ratio || {}
  const selectedGroup = resolveModelListPricingGroup(model, groupFilter)
  const selectedGroupDisplay = selectedGroup
    ? getGroupPriceDisplay({
        model,
        group: selectedGroup,
        groupRatio,
        tokenUnit,
        showWithRecharge,
        priceRate,
        usdExchangeRate,
        now,
      })
    : null
  const requestPriceDisplay = selectedGroup
    ? selectedGroupDisplay?.billingType === 'request'
      ? selectedGroupDisplay
      : null
    : getDefaultRequestPriceDisplay({
        model,
        groupRatio,
        tokenUnit,
        showWithRecharge,
        priceRate,
        usdExchangeRate,
        now,
      })
  const dynamicSummary = getDynamicPricingSummary(model, {
    tokenUnit,
    showRechargePrice: showWithRecharge,
    priceRate,
    usdExchangeRate,
    groupRatioMultiplier: getSelectedGroupRatio(
      model,
      selectedGroup,
      groupRatio
    ),
  })

  return {
    model,
    selectedGroup,
    groupRatio,
    tokenUnit,
    showWithRecharge,
    priceRate,
    usdExchangeRate,
    requestPriceDisplay,
    dynamicSummary,
  }
}

export function formatModelListTokenPrice(
  context: ModelListPricingContext,
  type: PriceType
): string {
  if (context.selectedGroup) {
    return formatGroupPrice(
      context.model,
      context.selectedGroup,
      type,
      context.tokenUnit,
      context.showWithRecharge,
      context.priceRate,
      context.usdExchangeRate,
      context.groupRatio
    )
  }

  return formatPrice(
    context.model,
    type,
    context.tokenUnit,
    context.showWithRecharge,
    context.priceRate,
    context.usdExchangeRate
  )
}
