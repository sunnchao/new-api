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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Terminal,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import { DOCS_TUTORIAL_PATHS } from '../constants'
import { TUTORIALS } from '../data/tutorials'
import {
  getAnthropicCompatibleBaseUrl,
  getApiOrigin,
  getGeminiCompatibleBaseUrl,
  getOpenAiCompatibleBaseUrl,
} from '../lib/api-origin'
import type { DocsTutorialSlug, TutorialDefinition } from '../types'
import { TutorialCodeBlock } from './tutorial-code-block'

type TutorialPageProps = {
  slug: DocsTutorialSlug
}

function fillPlaceholders(code: string): string {
  return code
    .replaceAll('{{OPENAI_BASE_URL}}', getOpenAiCompatibleBaseUrl())
    .replaceAll('{{ANTHROPIC_BASE_URL}}', getAnthropicCompatibleBaseUrl())
    .replaceAll('{{GEMINI_BASE_URL}}', getGeminiCompatibleBaseUrl())
    .replaceAll('{{API_ORIGIN}}', getApiOrigin())
}

function terminalToneClass(
  tone: TutorialDefinition['terminalLines'][number]['tone']
): string {
  if (tone === 'ok') return 'text-emerald-400'
  if (tone === 'info') return 'text-sky-300'
  if (tone === 'muted') return 'text-zinc-500'
  return 'text-zinc-100'
}

export function TutorialPage(props: TutorialPageProps) {
  const { t } = useTranslation()
  const tutorial = TUTORIALS[props.slug]
  const [activeSection, setActiveSection] = useState(
    tutorial.sections[0]?.id ?? 'install'
  )

  const siblingLinks = useMemo(
    () =>
      (Object.keys(DOCS_TUTORIAL_PATHS) as DocsTutorialSlug[]).map((slug) => ({
        slug,
        href: DOCS_TUTORIAL_PATHS[slug],
        name: TUTORIALS[slug].name,
      })),
    []
  )

  const endpointHint = useMemo(() => {
    if (props.slug === 'claude-code') {
      return {
        label: t('Anthropic base URL'),
        value: getAnthropicCompatibleBaseUrl(),
        note: t('Claude Code appends /v1/messages automatically'),
      }
    }
    if (props.slug === 'gemini-cli') {
      return {
        label: t('Gemini base URL'),
        value: getGeminiCompatibleBaseUrl(),
        note: t('Gemini CLI calls /v1beta routes on this host'),
      }
    }
    return {
      label: t('OpenAI-compatible base URL'),
      value: getOpenAiCompatibleBaseUrl(),
      note: t('Include /v1 for OpenAI-compatible clients'),
    }
  }, [props.slug, t])

  return (
    <PublicLayout showMainContainer={false}>
      <main className='relative min-h-svh overflow-hidden'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 -z-10 opacity-30 dark:opacity-[0.14]'
          style={{
            background: [
              'radial-gradient(ellipse 55% 45% at 15% 10%, oklch(0.72 0.16 250 / 55%) 0%, transparent 70%)',
              'radial-gradient(ellipse 45% 40% at 85% 5%, oklch(0.70 0.14 300 / 40%) 0%, transparent 70%)',
            ].join(', '),
          }}
        />

        <div className='mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='mb-6 flex flex-wrap items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground -ms-2'
              render={<Link to='/docs' />}
            >
              <ArrowLeft className='size-4' />
              {t('All tutorials')}
            </Button>
            <div className='bg-border/60 mx-1 hidden h-4 w-px sm:block' />
            <div className='flex flex-wrap gap-1.5'>
              {siblingLinks.map((item) => (
                <Link
                  key={item.slug}
                  to={item.href}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    item.slug === props.slug
                      ? 'border-foreground/20 bg-foreground/5 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <section className='grid gap-10 lg:grid-cols-12 lg:items-start'>
            <div className='lg:col-span-7'>
              <div
                className={cn(
                  'mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-medium text-white shadow-sm',
                  tutorial.heroGradient
                )}
              >
                <SparkleDot />
                {t(tutorial.badgeKey)}
              </div>

              <h1 className='text-3xl leading-tight font-bold tracking-tight sm:text-4xl'>
                {t(tutorial.titleKey)}
              </h1>
              <p className='text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed sm:text-[15px]'>
                {t(tutorial.subtitleKey)}
              </p>

              <div className='mt-6 flex flex-wrap gap-3'>
                <Button
                  className='h-10 rounded-lg px-4'
                  render={<Link to='/sign-up' />}
                >
                  {t('Get API key')}
                  <ArrowRight className='ms-1.5 size-4' />
                </Button>
                {tutorial.officialUrl ? (
                  <Button
                    variant='outline'
                    className='h-10 rounded-lg px-4'
                    render={
                      <a
                        href={tutorial.officialUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      />
                    }
                  >
                    {t('Tool official docs')}
                    <ExternalLink className='ms-1.5 size-3.5' />
                  </Button>
                ) : null}
              </div>

              <div className='border-border/50 bg-muted/20 mt-8 rounded-2xl border p-4 sm:p-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <Terminal className='text-muted-foreground size-4' />
                  <span className='text-sm font-medium'>{t('Terminal preview')}</span>
                </div>
                <div className='overflow-hidden rounded-xl bg-zinc-950 p-4 font-mono text-[13px] leading-relaxed text-zinc-100'>
                  {tutorial.terminalLines.map((line) => (
                    <div
                      key={line.text}
                      className={cn(
                        'whitespace-pre-wrap',
                        terminalToneClass(line.tone)
                      )}
                    >
                      {line.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='lg:col-span-5'>
              <Card className='border-border/60 rounded-2xl shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>
                    {t('Your gateway endpoints')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'Values below are generated from the current site origin so you can copy them directly.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      {endpointHint.label}
                    </div>
                    <TutorialCodeBlock code={endpointHint.value} label={t('Base URL')} />
                    <p className='text-muted-foreground text-xs'>{endpointHint.note}</p>
                  </div>
                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      {t('API key')}
                    </div>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {t(
                        'Create a token in the console Keys page, then paste it into the environment variables shown in the steps below.'
                      )}
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      className='rounded-lg'
                      render={<Link to='/keys' />}
                    >
                      {t('Open Keys')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className='mt-12'>
            <div className='mb-5 flex items-center gap-2'>
              <div
                className={cn(
                  'h-5 w-1 rounded-full bg-gradient-to-b',
                  tutorial.heroGradient
                )}
              />
              <h2 className='text-lg font-semibold tracking-tight'>
                {t('Feature overview')}
              </h2>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              {tutorial.features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card
                    key={feature.titleKey}
                    className='border-border/50 bg-card/60 rounded-xl'
                  >
                    <CardContent className='flex gap-3 p-4'>
                      <div
                        className={cn(
                          'bg-muted/50 flex size-10 shrink-0 items-center justify-center rounded-lg',
                          tutorial.accentClassName
                        )}
                      >
                        <Icon className='size-5' />
                      </div>
                      <div className='min-w-0'>
                        <div className='text-sm font-medium'>
                          {t(feature.titleKey)}
                        </div>
                        <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
                          {t(feature.descriptionKey)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              {tutorial.specs.map((spec) => {
                const Icon = spec.icon
                return (
                  <div
                    key={spec.titleKey}
                    className='border-border/50 bg-muted/15 flex items-center gap-3 rounded-xl border px-4 py-3'
                  >
                    <Icon className={cn('size-4 shrink-0', tutorial.accentClassName)} />
                    <div>
                      <div className='text-sm font-medium'>{t(spec.titleKey)}</div>
                      <div className='text-muted-foreground text-xs'>
                        {t(spec.descriptionKey)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className='mt-12'>
            <div className='mb-5 flex items-center gap-2'>
              <div
                className={cn(
                  'h-5 w-1 rounded-full bg-gradient-to-b',
                  tutorial.heroGradient
                )}
              />
              <h2 className='text-lg font-semibold tracking-tight'>
                {t('Setup guide')}
              </h2>
            </div>

            <Card className='border-border/60 rounded-2xl'>
              <CardContent className='p-4 sm:p-6'>
                <Tabs
                  value={activeSection}
                  onValueChange={setActiveSection}
                  className='gap-5'
                >
                  <TabsList variant='default' className='h-auto flex-wrap'>
                    {tutorial.sections.map((section) => (
                      <TabsTrigger key={section.id} value={section.id}>
                        {t(section.titleKey)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {tutorial.sections.map((section) => (
                    <TabsContent key={section.id} value={section.id} className='mt-0'>
                      <div className='space-y-6'>
                        {section.steps.map((step, stepIndex) => (
                          <div
                            key={`${section.id}-${step.titleKey}`}
                            className='border-border/40 rounded-xl border p-4 sm:p-5'
                          >
                            <div className='mb-3 flex items-start gap-3'>
                              <Badge
                                variant='secondary'
                                className='mt-0.5 shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px]'
                              >
                                {stepIndex + 1}
                              </Badge>
                              <div className='min-w-0'>
                                <h3 className='text-base font-semibold tracking-tight'>
                                  {t(step.titleKey)}
                                </h3>
                                {step.descriptionKey ? (
                                  <p className='text-muted-foreground mt-1.5 text-sm leading-relaxed'>
                                    {t(step.descriptionKey)}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {step.bulletsKeys && step.bulletsKeys.length > 0 ? (
                              <ul className='mb-4 space-y-2 ps-1'>
                                {step.bulletsKeys.map((bulletKey) => (
                                  <li
                                    key={bulletKey}
                                    className='text-muted-foreground flex items-start gap-2 text-sm'
                                  >
                                    <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                                    <span>{t(bulletKey)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}

                            {step.codeBlocks && step.codeBlocks.length > 0 ? (
                              <div className='space-y-3'>
                                {step.codeBlocks.map((block) => (
                                  <TutorialCodeBlock
                                    key={`${step.titleKey}-${block.labelKey ?? block.code.slice(0, 24)}`}
                                    label={
                                      block.labelKey
                                        ? t(block.labelKey)
                                        : undefined
                                    }
                                    code={fillPlaceholders(block.code)}
                                  />
                                ))}
                              </div>
                            ) : null}

                            {step.tipKey ? (
                              <div className='border-amber-500/20 bg-amber-500/5 text-amber-950 dark:text-amber-100 mt-4 flex gap-2 rounded-lg border px-3 py-2.5 text-sm'>
                                <Lightbulb className='mt-0.5 size-4 shrink-0 text-amber-500' />
                                <span>{t(step.tipKey)}</span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </section>

          <section className='mt-12'>
            <div className='mb-5 flex items-center gap-2'>
              <div
                className={cn(
                  'h-5 w-1 rounded-full bg-gradient-to-b',
                  tutorial.heroGradient
                )}
              />
              <h2 className='text-lg font-semibold tracking-tight'>
                {t('Ready to start?')}
              </h2>
            </div>
            <p className='text-muted-foreground mb-5 max-w-2xl text-sm'>
              {t(
                'Three short steps are enough to route this vibe-coding tool through your New API deployment.'
              )}
            </p>
            <div className='grid gap-4 sm:grid-cols-3'>
              {tutorial.ctas.map((cta) => {
                const Icon = cta.icon
                return (
                  <Card
                    key={cta.titleKey}
                    className='border-border/50 hover:border-border rounded-2xl transition-colors'
                  >
                    <CardContent className='p-5'>
                      <div className='text-muted-foreground/25 text-5xl font-bold tracking-tighter'>
                        {cta.number}
                      </div>
                      <Icon
                        className={cn('mt-2 size-7', tutorial.accentClassName)}
                      />
                      <div className='mt-3 text-base font-semibold'>
                        {t(cta.titleKey)}
                      </div>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {t(cta.descriptionKey)}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}

function SparkleDot() {
  return (
    <span className='relative flex size-1.5'>
      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75' />
      <span className='relative inline-flex size-1.5 rounded-full bg-white' />
    </span>
  )
}
