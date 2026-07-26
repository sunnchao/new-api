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
import type { LucideIcon } from 'lucide-react'

export type DocsTutorialSlug =
  | 'codex'
  | 'claude-code'
  | 'grok-cli'
  | 'gemini-cli'

export type TutorialFeature = {
  titleKey: string
  descriptionKey: string
  icon: LucideIcon
}

export type TutorialStep = {
  titleKey: string
  descriptionKey?: string
  bulletsKeys?: string[]
  codeBlocks?: TutorialCodeBlock[]
  tipKey?: string
}

export type TutorialCodeBlock = {
  labelKey?: string
  code: string
  language?: string
}

export type TutorialSection = {
  id: string
  titleKey: string
  steps: TutorialStep[]
}

export type TutorialCta = {
  number: string
  titleKey: string
  descriptionKey: string
  icon: LucideIcon
}

export type TutorialDefinition = {
  slug: DocsTutorialSlug
  name: string
  badgeKey: string
  titleKey: string
  subtitleKey: string
  heroGradient: string
  accentClassName: string
  terminalLines: { text: string; tone?: 'cmd' | 'ok' | 'info' | 'muted' }[]
  features: TutorialFeature[]
  specs: { titleKey: string; descriptionKey: string; icon: LucideIcon }[]
  sections: TutorialSection[]
  ctas: TutorialCta[]
  officialUrl?: string
}
