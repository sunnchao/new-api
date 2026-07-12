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
import type { DocsTutorialSlug } from './types'

export const DEFAULT_OFFICIAL_DOCS_URL = 'https://docs.newapi.pro'

export const DOCS_TUTORIAL_PATHS = {
  codex: '/docs/codex',
  'claude-code': '/docs/claude-code',
  'grok-cli': '/docs/grok-cli',
  'gemini-cli': '/docs/gemini-cli',
} as const satisfies Record<DocsTutorialSlug, string>

export const DOCS_TUTORIAL_SLUGS = Object.keys(
  DOCS_TUTORIAL_PATHS
) as DocsTutorialSlug[]
