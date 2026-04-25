import {
  MATCH_CONTAINS,
  MATCH_EQ,
  MATCH_EXISTS,
  REQUEST_RULE_ACTION_FIXED,
  REQUEST_RULE_ACTION_MULTIPLIER,
  SOURCE_TOKEN_GROUP,
  splitBillingExprAndRequestRules,
  tryParseRequestRuleExpr,
} from '../pages/Setting/Ratio/components/requestRuleExpr';

function matchTokenGroupCondition(cond, usingGroup) {
  const normalizedGroup = `${usingGroup || ''}`.trim();
  const normalizedValue = `${cond?.value || ''}`.trim();

  switch (cond?.mode || MATCH_EQ) {
    case MATCH_EXISTS:
      return normalizedGroup !== '';
    case MATCH_CONTAINS:
      return normalizedValue !== '' && normalizedGroup.includes(normalizedValue);
    case MATCH_EQ:
    default:
      return normalizedGroup === normalizedValue;
  }
}

function resolveRuleGroupState(group, usingGroup) {
  const conditions = Array.isArray(group?.conditions) ? group.conditions : [];
  if (conditions.length === 0) {
    return 'unmatched';
  }

  let hasUnknownCondition = false;
  for (const cond of conditions) {
    if ((cond?.source || '') !== SOURCE_TOKEN_GROUP) {
      hasUnknownCondition = true;
      continue;
    }
    if (!matchTokenGroupCondition(cond, usingGroup)) {
      return 'unmatched';
    }
  }

  return hasUnknownCondition ? 'unknown' : 'matched';
}

export function resolveTieredDisplayPricing({ billingExpr, usingGroup }) {
  const { requestRuleExpr } = splitBillingExprAndRequestRules(billingExpr || '');
  if (!requestRuleExpr) {
    return null;
  }

  const ruleGroups = tryParseRequestRuleExpr(requestRuleExpr);
  if (!Array.isArray(ruleGroups) || ruleGroups.length === 0) {
    return null;
  }

  let fixedPrice = null;
  let multiplier = 1;
  let blockedByUnknownFixed = false;
  let hasUnknownMultiplier = false;

  for (const group of ruleGroups) {
    const actionType = group?.actionType || REQUEST_RULE_ACTION_MULTIPLIER;
    const matchState = resolveRuleGroupState(group, usingGroup);

    if (actionType === REQUEST_RULE_ACTION_FIXED) {
      if (fixedPrice !== null) {
        continue;
      }
      if (matchState === 'unmatched') {
        continue;
      }
      if (matchState === 'unknown') {
        blockedByUnknownFixed = true;
        continue;
      }
      if (blockedByUnknownFixed) {
        return null;
      }

      const parsedPrice = Number.parseFloat(`${group?.fixedPrice || ''}`.trim());
      if (!Number.isFinite(parsedPrice)) {
        return null;
      }
      fixedPrice = parsedPrice;
      continue;
    }

    if (matchState === 'unmatched') {
      continue;
    }
    if (matchState === 'unknown') {
      hasUnknownMultiplier = true;
      continue;
    }

    const parsedMultiplier = Number.parseFloat(`${group?.multiplier || ''}`.trim());
    if (!Number.isFinite(parsedMultiplier)) {
      return null;
    }
    multiplier *= parsedMultiplier;
  }

  if (fixedPrice === null || blockedByUnknownFixed || hasUnknownMultiplier) {
    return null;
  }

  return {
    effectiveQuotaType: 1,
    modelPrice: fixedPrice * multiplier,
  };
}
