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
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useStatus } from '@/hooks/use-status'
import { cn } from '@/lib/utils'

import { DOCS_TUTORIAL_PATHS } from './constants'
import { TUTORIALS } from './data/tutorials'
import { buildDocsMenuItems } from './lib/docs-menu-items'
import type { DocsTutorialSlug } from './types'

const TUTORIAL_CARD_META: Record<
  DocsTutorialSlug,
  { gradient: string; blurbKey: string }
> = {
  codex: {
    gradient: 'from-emerald-500/15 to-teal-500/5',
    blurbKey: 'OpenAI Codex CLI setup with this gateway',
  },
  'claude-code': {
    gradient: 'from-blue-500/15 to-violet-500/5',
    blurbKey: 'Anthropic Claude Code + New API endpoint',
  },
  'grok-cli': {
    gradient: 'from-zinc-500/15 to-neutral-500/5',
    blurbKey: 'Grok / xAI CLI configuration tutorial',
  },
  'gemini-cli': {
    gradient: 'from-purple-500/15 to-pink-500/5',
    blurbKey: 'Google Gemini CLI configuration tutorial',
  },
}

export function DocsHubPage() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const officialDocsUrl = status?.docs_link as string | undefined
  const menuItems = useMemo(
    () => buildDocsMenuItems(officialDocsUrl),
    [officialDocsUrl]
  )
  const officialItem = menuItems.find((item) => item.external)

  return (
    <PublicLayout showMainContainer={false}>
      <main className='mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
        <section className='max-w-3xl'>
          <div className='text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400'>
            <BookOpen className='size-3.5' />
            {t('Docs')}
          </div>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('Vibe coding tool tutorials')}
          </h1>
          <p className='text-muted-foreground mt-4 text-base leading-relaxed'>
            {t(
              'Configure popular terminal coding agents to use this New API deployment as their upstream. Each guide includes install steps, env vars, and copy-ready endpoints.'
            )}
          </p>
          {officialItem ? (
            <div className='mt-6'>
              <Button
                variant='outline'
                className='rounded-lg'
                render={
                  <a
                    href={officialItem.href}
                    target='_blank'
                    rel='noopener noreferrer'
                  />
                }
              >
                {t('Official documentation')}
                <ExternalLink className='ms-1.5 size-3.5' />
              </Button>
            </div>
          ) : null}
        </section>

        <section className='mt-10 grid gap-4 sm:grid-cols-2'>
          {(Object.keys(DOCS_TUTORIAL_PATHS) as DocsTutorialSlug[]).map(
            (slug) => {
              const tutorial = TUTORIALS[slug]
              const meta = TUTORIAL_CARD_META[slug]
              return (
                <Card
                  key={slug}
                  className='border-border/60 group overflow-hidden rounded-2xl transition-shadow hover:shadow-md'
                >
                  <div
                    className={cn(
                      'h-1.5 w-full bg-gradient-to-r',
                      tutorial.heroGradient
                    )}
                  />
                  <CardHeader className={cn('bg-gradient-to-br', meta.gradient)}>
                    <CardTitle className='text-xl'>{tutorial.name}</CardTitle>
                    <CardDescription>{t(meta.blurbKey)}</CardDescription>
                  </CardHeader>
                  <CardContent className='flex items-center justify-between gap-3 pt-0 pb-5'>
                    <p className='text-muted-foreground line-clamp-2 text-sm'>
                      {t(tutorial.subtitleKey)}
                    </p>
                    <Button
                      size='sm'
                      className='shrink-0 rounded-lg'
                      render={<Link to={DOCS_TUTORIAL_PATHS[slug]} />}
                    >
                      {t('Open guide')}
                      <ArrowRight className='ms-1 size-3.5 transition-transform group-hover:translate-x-0.5' />
                    </Button>
                  </CardContent>
                </Card>
              )
            }
          )}
        </section>
      </main>
    </PublicLayout>
  )
}

export { TutorialPage } from './components/tutorial-page'
export { DocsDropdown } from './components/docs-dropdown'
