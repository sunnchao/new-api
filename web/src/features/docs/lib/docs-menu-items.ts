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
import {
  DEFAULT_OFFICIAL_DOCS_URL,
  DOCS_TUTORIAL_PATHS,
} from '../constants'

export type DocsMenuItem = {
  title: string
  href: string
  description?: string
  external?: boolean
}

/**
 * Build the Docs secondary menu entries for top nav / homepage.
 * `officialDocsUrl` comes from backend `docs_link` when configured.
 */
export function buildDocsMenuItems(
  officialDocsUrl?: string | null
): DocsMenuItem[] {
  const officialHref =
    officialDocsUrl && officialDocsUrl.trim().length > 0
      ? officialDocsUrl.trim()
      : DEFAULT_OFFICIAL_DOCS_URL

  return [
    {
      title: 'Codex',
      href: DOCS_TUTORIAL_PATHS.codex,
      description: 'OpenAI Codex CLI setup with this gateway',
    },
    {
      title: 'Claude Code',
      href: DOCS_TUTORIAL_PATHS['claude-code'],
      description: 'Anthropic Claude Code + New API endpoint',
    },
    {
      title: 'Grok CLI',
      href: DOCS_TUTORIAL_PATHS['grok-cli'],
      description: 'Grok / xAI CLI configuration tutorial',
    },
    {
      title: 'Gemini CLI',
      href: DOCS_TUTORIAL_PATHS['gemini-cli'],
      description: 'Google Gemini CLI configuration tutorial',
    },
    {
      title: 'Official documentation',
      href: officialHref,
      description: 'New API project documentation',
      external: true,
    },
  ]
}
