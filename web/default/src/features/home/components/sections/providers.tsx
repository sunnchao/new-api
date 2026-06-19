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
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { AnimateInView } from '@/components/animate-in-view'

interface ProviderItem {
  label: string
  icon?: string
  short?: string
  color: string
  darkColor?: string
}

const PROVIDERS: ProviderItem[] = [
  { label: 'OpenAI', icon: 'OpenAI', color: '#10a37f' },
  { label: 'Claude', icon: 'Claude.Color', color: '#d97757' },
  { label: 'Gemini', icon: 'Gemini.Color', color: '#1a73e8' },
  { label: 'DeepSeek', icon: 'DeepSeek.Color', color: '#4f46e5' },
  { label: 'Qwen', icon: 'Qwen.Color', color: '#7c3aed' },
  { label: 'Grok', icon: 'Grok', color: '#111827' },
  { label: 'Midjourney', icon: 'Midjourney', color: '#2563eb' },
  { label: 'Azure', icon: 'Azure.Color', color: '#0078d4' },
  { label: 'Cohere', icon: 'Cohere.Color', color: '#39594d' },
  { label: 'Zhipu', icon: 'Zhipu.Color', color: '#3b82f6' },
  { label: 'Moonshot', icon: 'Moonshot', color: '#111827' },
  { label: 'Hunyuan', icon: 'Hunyuan.Color', color: '#16a34a' },
  { label: 'Spark', icon: 'Spark.Color', color: '#2563eb' },
  { label: 'Volcengine', icon: 'Volcengine.Color', color: '#2563eb' },
  { label: 'Wenxin', icon: 'Wenxin.Color', color: '#4f46e5' },
  { label: 'Suno', icon: 'Suno', color: '#111827' },
  { label: 'xAI', icon: 'XAI', color: '#111827' },
  { label: 'MiniMax', icon: 'Minimax.Color', color: '#f97316' },
  { label: 'Mistral', icon: 'Mistral.Color', color: '#f59e0b' },
  { label: 'Perplexity', icon: 'Perplexity.Color', color: '#14b8a6' },
  { label: 'OpenRouter', icon: 'OpenRouter', color: '#111827' },
  { label: 'SiliconFlow', icon: 'SiliconCloud.Color', color: '#2563eb' },
  { label: 'Cloudflare', icon: 'Cloudflare.Color', color: '#f97316' },
  { label: 'Jina', icon: 'Jina', color: '#111827' },
  { label: 'Doubao', icon: 'Doubao.Color', color: '#2563eb' },
  { label: 'Yi', icon: 'Yi.Color', color: '#111827' },
  { label: '360', icon: 'Ai360.Color', color: '#2563eb' },
  { label: 'Ollama', icon: 'Ollama', color: '#111827' },
  { label: 'Replicate', icon: 'Replicate', color: '#111827' },
  { label: 'Kling', icon: 'Kling.Color', color: '#8b5cf6' },
  { label: 'Jimeng', icon: 'Jimeng.Color', color: '#ec4899' },
  { label: 'Dify', icon: 'Dify.Color', color: '#2563eb' },
  { label: 'Coze', icon: 'Coze', color: '#111827' },
  { label: '30+', short: '30+', color: '#2563eb' },
]

function ProviderIcon({ provider }: { provider: ProviderItem }) {
  if (!provider.icon) {
    return (
      <span className='text-[12px] leading-none font-bold'>
        {provider.short || provider.label.slice(0, 2)}
      </span>
    )
  }

  return getLobeIcon(provider.icon, 24)
}

export function Providers() {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 overflow-hidden px-6 py-20 md:py-24'>
      <div
        aria-hidden
        className='absolute inset-x-0 top-1/2 -z-10 h-72 -translate-y-1/2 opacity-15 blur-3xl dark:opacity-[0.07]'
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
        }}
      />

      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-10 text-center md:mb-12'>
          <p className='text-muted-foreground text-lg leading-tight font-medium tracking-tight md:text-xl lg:text-2xl'>
            {t('Supporting various LLM providers')}
          </p>
        </AnimateInView>

        <div className='grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 sm:gap-x-4 md:grid-cols-8 lg:grid-cols-12'>
          {PROVIDERS.map((provider, index) => {
            const providerColor = provider.color
            const providerDarkColor =
              provider.darkColor ||
              (provider.color === '#111827' ? '#e5e7eb' : provider.color)

            return (
              <AnimateInView
                key={provider.label}
                delay={(index % 12) * 30}
                animation='scale-in'
                className='group flex min-w-0 flex-col items-center gap-2'
              >
                <div
                  className={cn(
                    'relative flex size-12 items-center justify-center overflow-hidden rounded-xl border',
                    'bg-background/80 text-[var(--provider-color)] shadow-sm backdrop-blur-sm',
                    'transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-md',
                    'dark:bg-muted/20 dark:text-[var(--provider-color-dark)]'
                  )}
                  style={
                    {
                      '--provider-color': providerColor,
                      '--provider-color-dark': providerDarkColor,
                      borderColor: `${providerColor}24`,
                    } as CSSProperties
                  }
                >
                  <span
                    aria-hidden
                    className='absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                    style={{
                      background: `radial-gradient(circle at 35% 25%, ${providerColor}24, transparent 70%)`,
                    }}
                  />
                  <span className='relative z-10 flex items-center justify-center'>
                    <ProviderIcon provider={provider} />
                  </span>
                </div>
                <span className='text-muted-foreground group-hover:text-foreground max-w-[78px] truncate text-center text-[12px] font-medium transition-colors duration-300'>
                  {provider.label}
                </span>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
