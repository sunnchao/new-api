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
  let hasTokenGroupCondition = false;
  for (const cond of conditions) {
    if ((cond?.source || '') !== SOURCE_TOKEN_GROUP) {
      hasUnknownCondition = true;
      continue;
    }
    hasTokenGroupCondition = true;
    if (!matchTokenGroupCondition(cond, usingGroup)) {
      return 'unmatched';
    }
  }

  if (hasTokenGroupCondition) {
    return 'matched';
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
