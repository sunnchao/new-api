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
import * as z from "zod";

/**
 * Create search schema for settings routes with section parameter
 */
export function createSectionSearchSchema<TSectionId extends string>(
  sectionIds: readonly [TSectionId, ...TSectionId[]],
  defaultSection: TSectionId,
) {
  return z.object({
    section: z
      .enum(sectionIds as unknown as [string, ...string[]])
      .optional()
      .catch(defaultSection),
  });
}

/**
 * Coerce a section query parameter into a valid section ID.
 * Returns the default if the value is not in the allowed list.
 */
export function coerceSection<TSectionId extends string>(
  sectionIds: readonly TSectionId[],
  defaultSection: TSectionId,
  section?: string,
): TSectionId {
  return sectionIds.includes(section as TSectionId)
    ? (section as TSectionId)
    : defaultSection;
}
