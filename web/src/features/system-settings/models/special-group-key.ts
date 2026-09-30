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

// How a key of GroupSpecialUsableGroup changes what a user group can see:
// "+:name" (or no prefix) adds the group, "-:name" removes it, and "sub:name"
// keeps it hidden until the user holds a subscription that lists it.
export type SpecialGroupMode = 'visible' | 'hidden' | 'subscription'

const modePrefixes: Record<SpecialGroupMode, string> = {
  visible: '+:',
  hidden: '-:',
  subscription: 'sub:',
}

export function parseSpecialGroupKey(rawKey: string): {
  mode: SpecialGroupMode
  groupName: string
} {
  if (rawKey.startsWith(modePrefixes.hidden)) {
    return { mode: 'hidden', groupName: rawKey.slice(2) }
  }
  if (rawKey.startsWith(modePrefixes.subscription)) {
    return {
      mode: 'subscription',
      groupName: rawKey.slice(modePrefixes.subscription.length),
    }
  }
  if (rawKey.startsWith(modePrefixes.visible)) {
    return { mode: 'visible', groupName: rawKey.slice(2) }
  }
  return { mode: 'visible', groupName: rawKey }
}

export function toSpecialGroupKey(
  mode: SpecialGroupMode,
  groupName: string
): string {
  return modePrefixes[mode] + groupName
}
