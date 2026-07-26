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

const getTierRulePatterns = (rule) => {
  if (Array.isArray(rule?.model_patterns) && rule.model_patterns.length > 0) {
    return rule.model_patterns;
  }
  return rule?.model_pattern ? [rule.model_pattern] : [];
};

const matchTierRulePattern = (normalizedModel, pattern) => {
  if (!pattern) return false;

  const trimmed = pattern.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed === '*') return true;
  if (trimmed.endsWith('*')) {
    return normalizedModel.startsWith(trimmed.slice(0, -1));
  }
  return normalizedModel === trimmed;
};

export const getMatchedTierPricingRules = ({ modelName, tierPricingConfig }) => {
  if (!tierPricingConfig?.enabled || !tierPricingConfig?.rules?.length) {
    return [];
  }

  const normalizedModel = modelName?.toLowerCase() || '';
  const groupedRules = {};

  tierPricingConfig.rules.forEach((rule) => {
    if (!rule?.enabled) return;

    const matchedPattern = getTierRulePatterns(rule).find((pattern) =>
      matchTierRulePattern(normalizedModel, pattern),
    );

    if (!matchedPattern) return;

    if (!groupedRules[matchedPattern]) {
      groupedRules[matchedPattern] = [];
    }
    groupedRules[matchedPattern].push(rule);
  });

  Object.values(groupedRules).forEach((rules) => {
    rules.sort(
      (a, b) => (a?.min_prompt_tokens ?? 0) - (b?.min_prompt_tokens ?? 0),
    );
  });

  const firstPattern = Object.keys(groupedRules)[0];
  return firstPattern ? groupedRules[firstPattern] : [];
};

export const formatTierPricingTokens = (tokens) => {
  const numericTokens = Number(tokens ?? 0);

  if (numericTokens >= 1000000) {
    return `${(numericTokens / 1000000).toFixed(1)}M`;
  }
  if (numericTokens >= 1000) {
    return `${(numericTokens / 1000).toFixed(0)}K`;
  }
  return numericTokens.toString();
};

export const formatTierPricingTokenRange = (minTokens, maxTokens) => {
  const min = Number(minTokens ?? 0);
  const max = Number(maxTokens ?? 0);

  if (max === 0) {
    return `>${formatTierPricingTokens(min)}`;
  }
  if (min === 0) {
    return `≤${formatTierPricingTokens(max)}`;
  }
  return `${formatTierPricingTokens(min)}-${formatTierPricingTokens(max)}`;
};
