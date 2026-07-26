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

export function parseAllowedGroups(value) {
  const seen = new Set();
  const groups = [];

  for (const item of `${value || ''}`.split(',')) {
    const group = item.trim();
    if (!group || seen.has(group)) continue;
    seen.add(group);
    groups.push(group);
  }

  return groups;
}

function normalizeEnableGroups(value) {
  if (Array.isArray(value)) {
    return value.map((group) => `${group}`.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return parseAllowedGroups(value);
  }

  return [];
}

export function filterModelsByAllowedGroups(models, groups) {
  if (!Array.isArray(models) || groups.length === 0) return [];

  const allowed = new Set(groups);
  return models.filter((model) =>
    normalizeEnableGroups(model?.enable_groups).some((group) =>
      allowed.has(group),
    ),
  );
}

export function getSingleGroupPricingSearch(groups) {
  if (groups.length !== 1) return '';
  return `?group=${encodeURIComponent(groups[0])}`;
}
