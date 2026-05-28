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

import React, { useContext } from 'react';
import { Button, Typography } from '@douyinfe/semi-ui';
import { ArrowRight, BookOpen } from 'lucide-react';
import { CherryStudio } from '@lobehub/icons';
import * as LobeIcons from '@lobehub/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatusContext } from '../../context/Status';
import clsx from 'clsx';
import HeroTerminalDemo from './HeroTerminalDemo';
import './i18n';

const { Text } = Typography;

const supportedAppPillClass =
  'group flex items-center rounded-full border border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.82)] text-[rgb(51,65,85)] shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.96)] hover:text-[rgb(15,23,42)] hover:shadow-[0_16px_34px_-24px_rgba(15,23,42,0.52)] dark:border-[rgba(255,255,255,0.78)] dark:bg-[rgba(255,255,255,0.84)] dark:text-[rgb(51,65,85)] dark:shadow-[0_16px_34px_-28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.92)] dark:hover:border-[rgba(255,255,255,0.96)] dark:hover:bg-[rgba(255,255,255,0.94)] dark:hover:text-[rgb(15,23,42)]';

const MoreIcon = () => (
  <svg
    className='size-6 shrink-0 text-[rgb(148,163,184)] transition-colors group-hover:text-[rgb(51,65,85)] dark:text-[rgb(148,163,184)] dark:group-hover:text-[rgb(51,65,85)]'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='6' cy='12' r='2' fill='currentColor' />
    <circle cx='12' cy='12' r='2' fill='currentColor' />
    <circle cx='18' cy='12' r='2' fill='currentColor' />
  </svg>
);

const providersList = [
  { label: 'OpenAI', icon: 'OpenAI', color: '#10a37f' },
  { label: 'Claude', icon: 'Claude', variant: 'Color', color: '#d97757' },
  { label: 'Gemini', icon: 'Gemini', variant: 'Color', color: '#1a73e8' },
  { label: 'DeepSeek', icon: 'DeepSeek', variant: 'Color', color: '#4f46e5' },
  { label: 'Qwen', icon: 'Qwen', variant: 'Color', color: '#7c3aed' },
  { label: 'Grok', icon: 'Grok', color: '#111827' },
  { label: 'Midjourney', icon: 'Midjourney', color: '#2563eb' },
  { label: 'Azure', icon: 'Azure', variant: 'Color', color: '#0078d4' },
  { label: 'Cohere', icon: 'Cohere', variant: 'Color', color: '#39594d' },
  { label: 'Zhipu', icon: 'Zhipu', variant: 'Color', color: '#3b82f6' },
  { label: 'Moonshot', icon: 'Moonshot', color: '#111827' },
  { label: 'Hunyuan', icon: 'Hunyuan', variant: 'Color', color: '#16a34a' },
  { label: 'Spark', icon: 'Spark', variant: 'Color', color: '#2563eb' },
  {
    label: 'Volcengine',
    icon: 'Volcengine',
    variant: 'Color',
    color: '#2563eb',
  },
  { label: 'Wenxin', icon: 'Wenxin', variant: 'Color', color: '#4f46e5' },
  { label: 'Suno', icon: 'Suno', color: '#111827' },
  { label: 'xAI', icon: 'XAI', color: '#111827' },
  { label: 'MiniMax', icon: 'Minimax', variant: 'Color', color: '#f97316' },
  { label: 'Mistral', icon: 'Mistral', variant: 'Color', color: '#f59e0b' },
  {
    label: 'Perplexity',
    icon: 'Perplexity',
    variant: 'Color',
    color: '#14b8a6',
  },
  { label: 'OpenRouter', icon: 'OpenRouter', color: '#111827' },
  {
    label: 'SiliconFlow',
    icon: 'SiliconCloud',
    variant: 'Color',
    color: '#2563eb',
  },
  {
    label: 'Cloudflare',
    icon: 'Cloudflare',
    variant: 'Color',
    color: '#f97316',
  },
  { label: 'Jina', icon: 'Jina', color: '#111827' },
  { label: 'Doubao', icon: 'Doubao', variant: 'Color', color: '#2563eb' },
  { label: 'Yi', icon: 'Yi', variant: 'Color', color: '#111827' },
  { label: '360', icon: 'Ai360', variant: 'Color', color: '#2563eb' },
  { label: 'Ollama', icon: 'Ollama', color: '#111827' },
  { label: 'Replicate', icon: 'Replicate', color: '#111827' },
  { label: 'Kling', icon: 'Kling', variant: 'Color', color: '#8b5cf6' },
  { label: 'Jimeng', icon: 'Jimeng', variant: 'Color', color: '#ec4899' },
  { label: 'Dify', icon: 'Dify', variant: 'Color', color: '#2563eb' },
  { label: 'Coze', icon: 'Coze', color: '#111827' },
  { label: '30+', short: '30+', color: '#2563eb' },
];

function ProviderLogo({ provider }) {
  const BaseIcon = provider.icon ? LobeIcons[provider.icon] : null;
  const IconComponent =
    BaseIcon && provider.variant && BaseIcon[provider.variant]
      ? BaseIcon[provider.variant]
      : BaseIcon;

  if (
    !IconComponent ||
    (typeof IconComponent !== 'function' && typeof IconComponent !== 'object')
  ) {
    return (
      <span className='text-[12px] font-bold leading-none'>
        {provider.short || provider.label.slice(0, 2)}
      </span>
    );
  }

  return <IconComponent size={24} />;
}

const Hero = ({ isAuthenticated }) => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const docsUrl = statusState?.status?.docs_link || 'https://docs.newapi.pro';

  const renderDocsButton = () => {
    const isExternal = docsUrl.startsWith('http');
    const btn = (
      <Button
        size='large'
        className='!rounded-full px-5 text-sm font-medium'
        icon={<BookOpen className='size-4' />}
      >
        {t('Docs')}
      </Button>
    );
    if (isExternal) {
      return (
        <a href={docsUrl} target='_blank' rel='noopener noreferrer'>
          {btn}
        </a>
      );
    }
    return <Link to={docsUrl}>{btn}</Link>;
  };

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28'>
      {/* Radial gradient background */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-[0.12]'
        style={{
          background: [
          ].join(', '),
        }}
      />
      {/* Grid pattern */}
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--semi-color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--semi-color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.08]'
      />

      <div className='mx-auto max-w-7xl space-y-16'>
        {/* Top row: Left text + Right terminal demo */}
        <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8'>
          {/* Left Column */}
          <div className='flex flex-col items-start text-left lg:col-span-6'>
            {/* Top Pill Badge */}
            <div className='landing-animate-fade-up mb-5 inline-flex items-center gap-1.5 rounded-full border border-[rgba(59,130,246,0.20)] bg-[rgba(59,130,246,0.05)] px-3 py-1.5 text-[11px] font-medium text-[rgb(37,99,235)] shadow-xs dark:border-[rgba(147,197,253,0.32)] dark:bg-[rgba(147,197,253,0.08)] dark:text-[rgb(191,219,254)]'>
              <span className='relative flex size-1.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(96,165,250)] opacity-75' />
                <span className='relative inline-flex size-1.5 rounded-full bg-[rgb(59,130,246)] dark:bg-[rgb(147,197,253)]' />
              </span>
              <span>{t('AI Application Infrastructure Foundation')}</span>
            </div>

            <h1 className='landing-animate-fade-up text-semi-color-text-0 text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.15] font-bold tracking-tight'>
              {t('Unified API Gateway for')}
              <br />
              <span className='bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent'>
                {t('Vast Range of AI Models')}
              </span>
            </h1>
            <p className='landing-animate-fade-up text-semi-color-text-2 mt-5 max-w-xl text-base leading-relaxed md:text-[15px]'>
              {t(
                'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.',
              )}
            </p>

            <div className='landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3'>
              {isAuthenticated ? (
                <>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size='large'
                      className='!rounded-full px-5 text-sm font-medium'
                      icon={<ArrowRight className='ml-1.5 size-4' />}
                    >
                      {t('Go to Dashboard')}
                    </Button>
                  </Link>
                  {renderDocsButton()}
                </>
              ) : (
                <>
                  <Link to='/sign-up'>
                    <Button
                      theme='solid'
                      type='primary'
                      size='large'
                      className='!rounded-full px-5 text-sm font-medium'
                      icon={<ArrowRight className='ml-1.5 size-4' />}
                    >
                      {t('Get Started')}
                    </Button>
                  </Link>
                  <Link to='/pricing'>
                    <Button
                      size='large'
                      className='!rounded-full px-5 text-sm font-medium'
                    >
                      {t('View Pricing')}
                    </Button>
                  </Link>
                  {renderDocsButton()}
                </>
              )}
            </div>

            {/* Supported Apps */}
            <div className='landing-animate-fade-up mt-10 w-full max-w-xl'>
              <div className='mb-4 flex flex-col gap-1'>
                <Text
                  type='tertiary'
                  className='text-[10px] font-bold tracking-[0.15em] uppercase'
                >
                  {t('Supported Applications')}
                </Text>
                <p className='text-semi-color-text-2 text-xs leading-relaxed'>
                  {t(
                    'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.',
                  )}
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-3'>
                <a
                  href='https://cherry-ai.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={clsx(
                    supportedAppPillClass,
                    'gap-3 px-5 py-2.5 text-sm font-medium',
                  )}
                >
                  <CherryStudio.Color size={24} className='shrink-0' />
                  <span>Cherry Studio</span>
                </a>

                <a
                  href='https://ccswitch.io'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={clsx(
                    supportedAppPillClass,
                    'gap-3 px-5 py-2.5 text-sm font-medium',
                  )}
                >
                  <img
                    src='https://ccswitch.io/favicon.png'
                    alt='CC Switch'
                    className='size-6 shrink-0 rounded-md object-contain'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <span
                    style={{ display: 'none' }}
                    className='size-6 shrink-0 items-center justify-center rounded-md border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.8)] text-[10px] font-bold text-[rgb(51,65,85)] shadow-inner dark:border-[rgba(255,255,255,0.8)] dark:bg-[rgba(255,255,255,0.9)] dark:text-[rgb(51,65,85)]'
                  >
                    CC
                  </span>
                  <span>CC Switch</span>
                </a>

                <div
                  className={clsx(
                    supportedAppPillClass,
                    'cursor-default gap-2.5 px-5 py-2.5 text-sm font-medium',
                  )}
                >
                  <MoreIcon />
                  <span>{t('More Apps')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Terminal Demo */}
          <div className='landing-animate-fade-up flex w-full justify-center lg:col-span-6'>
            <HeroTerminalDemo className='mt-8 lg:mt-0' />
          </div>
        </div>

        {/* Bottom: Providers showcase */}
        <div className='landing-animate-fade-up relative py-6'>
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-[-5%] top-0 -z-10 h-full rounded-[2rem] opacity-100 blur-2xl dark:opacity-55'
            style={{}}
          />
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-[-2%] top-12 bottom-2 -z-10 rounded-[2rem] opacity-70 dark:opacity-30'
            style={{}}
          />
          <div className='flex items-center mb-6 md:mb-8 justify-center'>
            <Text type='tertiary' className='text-lg md:text-xl lg:text-2xl'>
              {t('支持众多的大模型供应商')}
            </Text>
          </div>
          <div className='mx-auto grid max-w-7xl grid-cols-6 gap-x-4 gap-y-5 sm:grid-cols-8 sm:gap-x-5 md:grid-cols-10 lg:grid-cols-12'>
            {providersList.map((provider) => (
              <div
                key={provider.label}
                className={clsx(
                  'group flex min-w-0 flex-col items-center gap-2 transition-all duration-300',
                  provider.cls,
                )}
              >
                <div
                  className='relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-white/75 text-[var(--provider-color)] shadow-[0_8px_24px_-18px_rgba(15,23,42,0.55)] backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_16px_34px_-22px_rgba(15,23,42,0.65)] dark:bg-white/[0.06] dark:text-[var(--provider-color-dark)]'
                  style={{
                    '--provider-color': provider.color,
                    '--provider-color-dark':
                      provider.darkColor ||
                      (provider.color === '#111827'
                        ? '#e2e8f0'
                        : provider.color),
                    borderColor: `${provider.color}22`,
                  }}
                >
                  <span
                    aria-hidden
                    className='absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                    style={{
                      background: `radial-gradient(circle at 35% 25%, ${provider.color}26, transparent 68%)`,
                    }}
                  />
                  <span className='relative z-10 flex items-center justify-center'>
                    <ProviderLogo provider={provider} />
                  </span>
                </div>
                <span className='text-semi-color-text-2 max-w-[78px] truncate text-center text-[12px] font-medium transition-colors duration-300 group-hover:text-semi-color-text-0'>
                  {provider.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
