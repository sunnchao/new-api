import { QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel, PriceType, TokenUnit } from '../types'
import {
  MATCH_CONTAINS,
  MATCH_EQ,
  MATCH_EXISTS,
  MATCH_GT,
  MATCH_GTE,
  MATCH_LT,
  MATCH_LTE,
  MATCH_RANGE,
  REQUEST_RULE_ACTION_FIXED,
  REQUEST_RULE_ACTION_MULTIPLIER,
  SOURCE_TIME,
  SOURCE_TOKEN_GROUP,
  splitBillingExprAndRequestRules,
  tryParseRequestRuleExpr,
  type RequestCondition,
  type RequestRuleGroup,
} from './billing-expr'
import { formatFixedPrice, formatGroupPrice } from './price'

export type GroupPriceItem = {
  key: string
  labelKey: string
  value: string
  suffix?: string
  suffixKey?: string
  isDynamic?: boolean
}

export type GroupPriceDisplay = {
  group: string
  ratio: number
  billingType: 'dynamic' | 'token' | 'request'
  effectiveQuotaType: number
  items: GroupPriceItem[]
}

type ResolveTieredDisplayPricingResult = {
  effectiveQuotaType: typeof QUOTA_TYPE_VALUES.REQUEST
  // Each entry represents one possible fixed-price rule that may apply.
  // matched=true means it will definitely apply; matched=false means it
  // depends on runtime token values (unknown conditions like `tokens`).
  prices: { modelPrice: number; certain: boolean }[]
}

type GroupPriceDisplayInput = {
  model: PricingModel
  group: string
  groupRatio: Record<string, number>
  tokenUnit: TokenUnit
  showWithRecharge?: boolean
  priceRate?: number
  usdExchangeRate?: number
  now?: Date
}

type DefaultGroupPriceDisplayInput = Omit<
  GroupPriceDisplayInput,
  'group' | 'groupRatio'
> & {
  groupRatio?: Record<string, number>
}

const TOKEN_PRICE_TYPES: {
  key: string
  labelKey: string
  type: PriceType
  available: (model: PricingModel) => boolean
}[] = [
  {
    key: 'input',
    labelKey: 'Input price',
    type: 'input',
    available: () => true,
  },
  {
    key: 'output',
    labelKey: 'Output price',
    type: 'output',
    available: () => true,
  },
  {
    key: 'cache',
    labelKey: 'Cache Read',
    type: 'cache',
    available: (model) => model.cache_ratio != null,
  },
  {
    key: 'create-cache',
    labelKey: 'Cache Write',
    type: 'create_cache',
    available: (model) => model.create_cache_ratio != null,
  },
  {
    key: 'image',
    labelKey: 'Image input',
    type: 'image',
    available: (model) => model.image_ratio != null,
  },
  {
    key: 'audio-input',
    labelKey: 'Audio input',
    type: 'audio_input',
    available: (model) => model.audio_ratio != null,
  },
  {
    key: 'audio-output',
    labelKey: 'Audio output',
    type: 'audio_output',
    available: (model) =>
      model.audio_ratio != null && model.audio_completion_ratio != null,
  },
]

function matchTokenGroupCondition(cond: RequestCondition, usingGroup: string) {
  if (cond.source !== SOURCE_TOKEN_GROUP) return false

  const normalizedGroup = `${usingGroup || ''}`.trim()
  const normalizedValue = `${cond.value || ''}`.trim()

  switch (cond.mode || MATCH_EQ) {
    case MATCH_EXISTS:
      return normalizedGroup !== ''
    case MATCH_CONTAINS:
      return normalizedValue !== '' && normalizedGroup.includes(normalizedValue)
    case MATCH_EQ:
    default:
      return normalizedGroup === normalizedValue
  }
}

type RuleMatchState = 'matched' | 'unmatched' | 'unknown'

function getTimePart(now: Date, timezone: string, timeFunc: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  switch (timeFunc) {
    case 'minute':
      return Number(values.minute)
    case 'weekday': {
      const weekdayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      }
      return weekdayMap[values.weekday] ?? NaN
    }
    case 'month':
      return Number(values.month)
    case 'day':
      return Number(values.day)
    case 'hour':
    default:
      return Number(values.hour)
  }
}

function compareNumericCondition(left: number, right: number, mode: string) {
  switch (mode) {
    case MATCH_GT:
      return left > right
    case MATCH_GTE:
      return left >= right
    case MATCH_LT:
      return left < right
    case MATCH_LTE:
      return left <= right
    case MATCH_EQ:
    default:
      return left === right
  }
}

function matchTimeCondition(cond: RequestCondition, now: Date): boolean | null {
  if (cond.source !== SOURCE_TIME) return null

  const current = getTimePart(now, cond.timezone, cond.timeFunc)
  if (!Number.isFinite(current)) return null

  if (cond.mode === MATCH_RANGE) {
    const start = Number(cond.rangeStart)
    const end = Number(cond.rangeEnd)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null
    return current >= start || current < end
  }

  const target = Number(cond.value)
  if (!Number.isFinite(target)) return null
  return compareNumericCondition(current, target, cond.mode)
}

function resolveConditionState(
  cond: RequestCondition,
  usingGroup: string,
  now: Date
): RuleMatchState {
  if (cond.source === SOURCE_TOKEN_GROUP) {
    return matchTokenGroupCondition(cond, usingGroup) ? 'matched' : 'unmatched'
  }

  if (cond.source === SOURCE_TIME) {
    const matched = matchTimeCondition(cond, now)
    if (matched == null) return 'unknown'
    return matched ? 'matched' : 'unmatched'
  }

  return 'unknown'
}

function resolveRuleGroupState(
  group: RequestRuleGroup,
  usingGroup: string,
  now: Date
): RuleMatchState {
  const conditions = Array.isArray(group.conditions) ? group.conditions : []
  if (conditions.length === 0) return 'unmatched'

  let hasUnknownCondition = false
  for (const cond of conditions) {
    const state = resolveConditionState(cond, usingGroup, now)
    if (state === 'unmatched') {
      return 'unmatched'
    }
    if (state === 'unknown') {
      hasUnknownCondition = true
    }
  }

  return hasUnknownCondition ? 'unknown' : 'matched'
}

export function resolveTieredDisplayPricing(
  billingExpr: string | null | undefined,
  usingGroup: string,
  now: Date = new Date()
): ResolveTieredDisplayPricingResult | null {
  const { requestRuleExpr } = splitBillingExprAndRequestRules(billingExpr || '')
  if (!requestRuleExpr) return null

  const ruleGroups = tryParseRequestRuleExpr(requestRuleExpr)
  if (!Array.isArray(ruleGroups) || ruleGroups.length === 0) return null

  // Collect all fixed-price rules that are matched or partially matched
  // (token_group condition matched but other conditions are unknown).
  // Also track the confirmed multiplier from fully-matched multiplier rules.
  const candidatePrices: { modelPrice: number; certain: boolean }[] = []
  let confirmedMultiplier = 1
  let hasUnknownMultiplier = false
  // Track whether a certain fixed price has been found (first one wins at runtime).
  let certainFixedFound = false

  for (const group of ruleGroups) {
    const actionType = group.actionType || REQUEST_RULE_ACTION_MULTIPLIER
    const matchState = resolveRuleGroupState(group, usingGroup, now)

    if (actionType === REQUEST_RULE_ACTION_FIXED) {
      // Once a certain fixed price is found, subsequent certain fixed rules are
      // skipped at runtime (first-match semantics). But unknown rules (partially
      // matched, e.g. token_group matched but tokens condition unknown) should
      // still be collected for display purposes.
      if (certainFixedFound && matchState !== 'unknown') continue
      if (matchState === 'unmatched') continue

      const parsedPrice = Number.parseFloat(`${group.fixedPrice || ''}`.trim())
      if (!Number.isFinite(parsedPrice)) continue

      if (matchState === 'matched') {
        candidatePrices.push({ modelPrice: parsedPrice, certain: true })
        certainFixedFound = true
      } else {
        // unknown — some conditions (e.g. tokens) are unknown at display time
        candidatePrices.push({ modelPrice: parsedPrice, certain: false })
      }
      continue
    }

    // Multiplier rules
    if (matchState === 'unmatched') continue
    if (matchState === 'unknown') {
      hasUnknownMultiplier = true
      continue
    }
    const parsedMultiplier = Number.parseFloat(`${group.multiplier || ''}`.trim())
    if (!Number.isFinite(parsedMultiplier)) return null
    confirmedMultiplier *= parsedMultiplier
  }

  if (candidatePrices.length === 0 || hasUnknownMultiplier) return null

  return {
    effectiveQuotaType: QUOTA_TYPE_VALUES.REQUEST,
    prices: candidatePrices.map((p) => ({
      modelPrice: p.modelPrice * confirmedMultiplier,
      certain: p.certain,
    })),
  }
}

function buildRequestItems(
  model: PricingModel,
  group: string,
  groupRatio: Record<string, number>,
  showWithRecharge: boolean,
  priceRate: number,
  usdExchangeRate: number
): GroupPriceItem[] {
  return [
    {
      key: 'fixed',
      labelKey: 'Model Price',
      value: formatFixedPrice(
        model,
        group,
        showWithRecharge,
        priceRate,
        usdExchangeRate,
        groupRatio
      ),
      suffixKey: 'per request',
    },
  ].filter((item) => item.value !== '-')
}

export function getGroupPriceDisplay({
  model,
  group,
  groupRatio,
  tokenUnit,
  showWithRecharge = false,
  priceRate = 1,
  usdExchangeRate = 1,
  now = new Date(),
}: GroupPriceDisplayInput): GroupPriceDisplay {
  const ratio = groupRatio[group] || 1

  if (model.billing_mode === 'tiered_expr' && model.billing_expr) {
    const resolvedPricing = resolveTieredDisplayPricing(
      model.billing_expr,
      group,
      now
    )

    if (!resolvedPricing) {
      return {
        group,
        ratio,
        billingType: 'dynamic',
        effectiveQuotaType: model.quota_type,
        items: [
          {
            key: 'dynamic',
            labelKey: 'Dynamic Pricing',
            value: '',
            suffixKey: 'See dynamic pricing details above',
            isDynamic: true,
          },
        ],
      }
    }

    const items: GroupPriceItem[] = resolvedPricing.prices.map((p, i) => {
      const effectiveModelForPrice: PricingModel = {
        ...model,
        quota_type: resolvedPricing.effectiveQuotaType,
        model_price: p.modelPrice,
      }
      return {
        key: `fixed-${i}`,
        labelKey: 'Model Price',
        value: formatFixedPrice(
          effectiveModelForPrice,
          group,
          showWithRecharge,
          priceRate,
          usdExchangeRate,
          { [group]: ratio }
        ),
        suffixKey: p.certain
          ? 'per request'
          : 'per request (if extra conditions met)',
      }
    })

    return {
      group,
      ratio,
      billingType: 'request',
      effectiveQuotaType: resolvedPricing.effectiveQuotaType,
      items,
    }
  }

  if (model.quota_type === QUOTA_TYPE_VALUES.TOKEN) {
    const suffix = `/ 1${tokenUnit} tokens`
    return {
      group,
      ratio,
      billingType: 'token',
      effectiveQuotaType: model.quota_type,
      items: TOKEN_PRICE_TYPES.filter((priceType) => priceType.available(model))
        .map((priceType) => ({
          key: priceType.key,
          labelKey: priceType.labelKey,
          value: formatGroupPrice(
            model,
            group,
            priceType.type,
            tokenUnit,
            showWithRecharge,
            priceRate,
            usdExchangeRate,
            groupRatio
          ),
          suffix,
        }))
        .filter((item) => item.value !== '-'),
    }
  }

  return {
    group,
    ratio,
    billingType: 'request',
    effectiveQuotaType: model.quota_type,
    items: buildRequestItems(
      model,
      group,
      groupRatio,
      showWithRecharge,
      priceRate,
      usdExchangeRate
    ),
  }
}

export function getDefaultGroupPriceDisplay({
  model,
  groupRatio,
  tokenUnit,
  showWithRecharge = false,
  priceRate = 1,
  usdExchangeRate = 1,
  now = new Date(),
}: DefaultGroupPriceDisplayInput): GroupPriceDisplay | null {
  const ratio = 1
  const defaultGroup = 'default'
  const enableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []

  if (
    model.billing_mode === 'tiered_expr' &&
    model.billing_expr &&
    enableGroups.includes(defaultGroup)
  ) {
    const display = getGroupPriceDisplay({
      model,
      group: defaultGroup,
      groupRatio: groupRatio || model.group_ratio || {},
      tokenUnit,
      showWithRecharge,
      priceRate,
      usdExchangeRate,
      now,
    })

    if (display.billingType === 'request') return display
  }

  if (model.quota_type === QUOTA_TYPE_VALUES.TOKEN) {
    const suffix = `/ 1${tokenUnit} tokens`
    return {
      group: '',
      ratio,
      billingType: 'token',
      effectiveQuotaType: model.quota_type,
      items: TOKEN_PRICE_TYPES.filter((priceType) => priceType.available(model))
        .map((priceType) => ({
          key: priceType.key,
          labelKey: priceType.labelKey,
          value: formatGroupPrice(
            model,
            '',
            priceType.type,
            tokenUnit,
            showWithRecharge,
            priceRate,
            usdExchangeRate,
            {}
          ),
          suffix,
        }))
        .filter((item) => item.value !== '-'),
    }
  }

  return {
    group: '',
    ratio,
    billingType: 'request',
    effectiveQuotaType: model.quota_type,
    items: [
      {
        key: 'fixed',
        labelKey: 'Model Price',
        value: formatFixedPrice(
          model,
          '',
          showWithRecharge,
          priceRate,
          usdExchangeRate,
          {}
        ),
        suffixKey: 'per request',
      },
    ].filter((item) => item.value !== '-'),
  }
}

export function getDefaultRequestPriceDisplay(
  input: DefaultGroupPriceDisplayInput
): GroupPriceDisplay | null {
  const display = getDefaultGroupPriceDisplay(input)
  return display?.billingType === 'request' ? display : null
}
