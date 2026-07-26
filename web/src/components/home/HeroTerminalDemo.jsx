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

import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

const ACCENT = {
  emerald: {
    activeText: 'text-[rgb(5,150,105)] dark:text-[rgb(52,211,153)]',
    activeBorder: 'border-[rgb(16,185,129)] dark:border-[rgb(52,211,153)]',
    badge:
      'bg-[rgba(16,185,129,0.10)] text-[rgb(5,150,105)] dark:bg-[rgba(52,211,153,0.12)] dark:text-[rgb(52,211,153)]',
  },
  amber: {
    activeText: 'text-[rgb(217,119,6)] dark:text-[rgb(251,191,36)]',
    activeBorder: 'border-[rgb(245,158,11)] dark:border-[rgb(251,191,36)]',
    badge:
      'bg-[rgba(245,158,11,0.10)] text-[rgb(217,119,6)] dark:bg-[rgba(251,191,36,0.12)] dark:text-[rgb(251,191,36)]',
  },
  blue: {
    activeText: 'text-[rgb(37,99,235)] dark:text-[rgb(96,165,250)]',
    activeBorder: 'border-[rgb(59,130,246)] dark:border-[rgb(96,165,250)]',
    badge:
      'bg-[rgba(59,130,246,0.10)] text-[rgb(37,99,235)] dark:bg-[rgba(96,165,250,0.12)] dark:text-[rgb(96,165,250)]',
  },
  violet: {
    activeText: 'text-[rgb(124,58,237)] dark:text-[rgb(167,139,250)]',
    activeBorder: 'border-[rgb(139,92,246)] dark:border-[rgb(167,139,250)]',
    badge:
      'bg-[rgba(139,92,246,0.10)] text-[rgb(124,58,237)] dark:bg-[rgba(167,139,250,0.12)] dark:text-[rgb(167,139,250)]',
  },
};

const DEMOS = [
  {
    id: 'gpt-chat',
    label: 'Chat',
    method: 'POST',
    endpoint: '/v1/chat/completions',
    headers: ['"Authorization: Bearer sk-••••"'],
    request: [
      '"model": "your-model",',
      '"messages": [',
      '  { "role": "user", "content": "..." }',
      ']',
    ],
    response: [
      '{',
      '  "choices": [{ "message": { "content": <text> } }],',
      '  "usage": { "total_tokens": <tokens> }',
      '}',
    ],
    tokens: 27,
    latency: 142,
    accent: 'emerald',
  },
  {
    id: 'responses',
    label: 'Responses',
    method: 'POST',
    endpoint: '/v1/responses',
    headers: ['"Authorization: Bearer sk-••••"'],
    request: ['"model": "your-model",', '"input": "..."'],
    response: [
      '{',
      '  "output": [{ "type": "output_text", "text": <text> }],',
      '  "usage": { "total_tokens": <tokens> }',
      '}',
    ],
    tokens: 31,
    latency: 168,
    accent: 'amber',
  },
  {
    id: 'claude',
    label: 'Claude',
    method: 'POST',
    endpoint: '/v1/messages',
    headers: ['"x-api-key: sk-••••"', '"anthropic-version: 2023-06-01"'],
    request: [
      '"model": "your-model",',
      '"max_tokens": 1024,',
      '"messages": [',
      '  { "role": "user", "content": "..." }',
      ']',
    ],
    response: [
      '{',
      '  "content": [{ "type": "text", "text": <text> }],',
      '  "usage": { "input_tokens": <in>, "output_tokens": <out> }',
      '}',
    ],
    tokens: 29,
    latency: 156,
    accent: 'blue',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    method: 'POST',
    endpoint: '/v1beta/models/{model}:generateContent',
    headers: ['"x-goog-api-key: sk-••••"'],
    request: [
      '"contents": [',
      '  { "role": "user",',
      '    "parts": [{ "text": "..." }] }',
      ']',
    ],
    response: [
      '{',
      '  "candidates": [{ "content": { "parts": [{ "text": <text> }] } }],',
      '  "usageMetadata": { "totalTokenCount": <tokens> }',
      '}',
    ],
    tokens: 25,
    latency: 93,
    accent: 'violet',
  },
];

const CYCLE_MS = 4500;
const TRANSITION_MS = 220;

const STRING_RE = /"[^"]*"/g;
const PLACEHOLDER_RE = /<[a-z]+>/gi;

function tokenizeLine(line) {
  const segments = [];
  let cursor = 0;
  const matches = [...line.matchAll(STRING_RE)];

  matches.forEach((match, idx) => {
    const start = match.index;
    if (start > cursor) {
      segments.push(
        <span key={`m-${idx}`} className='text-semi-color-text-2'>
          {line.slice(cursor, start)}
        </span>,
      );
    }
    const text = match[0];
    const after = line.slice(start + text.length).trimStart();
    if (after.startsWith(':')) {
      segments.push(
        <span
          key={`k-${idx}`}
          className='text-[rgb(3,105,161)] dark:text-[rgb(125,211,252)]'
        >
          {text}
        </span>,
      );
    } else {
      segments.push(
        <span
          key={`s-${idx}`}
          className='text-[rgb(180,83,9)] dark:text-[rgb(252,211,77)]'
        >
          {text}
        </span>,
      );
    }
    cursor = start + text.length;
  });

  if (cursor < line.length) {
    segments.push(
      <span key='tail' className='text-semi-color-text-2'>
        {line.slice(cursor)}
      </span>,
    );
  }

  return segments;
}

function renderResponseLine(line, demo) {
  if (!line.trim()) return <span className='text-semi-color-text-2'> </span>;

  const matches = [...line.matchAll(PLACEHOLDER_RE)];
  if (matches.length === 0) return tokenizeLine(line);

  const tone = ACCENT[demo.accent];
  const segments = [];
  let cursor = 0;

  matches.forEach((match, idx) => {
    const start = match.index;
    if (start > cursor) {
      segments.push(
        <span key={`pre-${idx}`}>
          {tokenizeLine(line.slice(cursor, start))}
        </span>,
      );
    }
    const ph = match[0];

    switch (ph) {
      case '<text>': {
        const map = {
          'gpt-chat': 'Chat request routed.',
          responses: 'Response workflow ready.',
          claude: 'Claude message routed.',
          gemini: 'Gemini request served.',
        };
        segments.push(
          <span
            key={`ph-${idx}`}
            className={clsx('font-medium', tone.activeText)}
          >
            &quot;{map[demo.id] ?? '...'}&quot;
          </span>,
        );
        break;
      }
      case '<tokens>':
        segments.push(
          <span
            key={`ph-${idx}`}
            className='font-medium text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]'
          >
            {demo.tokens}
          </span>,
        );
        break;
      case '<in>':
        segments.push(
          <span
            key={`ph-${idx}`}
            className='font-medium text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]'
          >
            {Math.floor(demo.tokens * 0.4)}
          </span>,
        );
        break;
      case '<out>':
        segments.push(
          <span
            key={`ph-${idx}`}
            className='font-medium text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]'
          >
            {Math.ceil(demo.tokens * 0.6)}
          </span>,
        );
        break;
      default:
        segments.push(
          <span key={`ph-${idx}`} className='text-semi-color-text-2'>
            {ph}
          </span>,
        );
    }
    cursor = start + ph.length;
  });

  if (cursor < line.length) {
    segments.push(<span key='tail'>{tokenizeLine(line.slice(cursor))}</span>);
  }

  return segments;
}

function SectionLabel({ children }) {
  return (
    <span className='text-semi-color-text-2 text-[10px] font-semibold tracking-[0.18em] uppercase'>
      {children}
    </span>
  );
}

function CodeLine({ children, indent }) {
  return (
    <div className='break-words whitespace-pre-wrap'>
      {indent ? (
        <span
          aria-hidden
          className='inline-block'
          style={{ width: `${indent}ch` }}
        />
      ) : null}
      {children}
    </div>
  );
}

export default function HeroTerminalDemo({ className }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const intervalRef = useRef(undefined);
  const timeoutRef = useRef(undefined);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    intervalRef.current = setInterval(() => {
      setTransitioning(true);
      timeoutRef.current = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % DEMOS.length);
        setTransitioning(false);
      }, TRANSITION_MS);
    }, CYCLE_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSelect = (idx) => {
    if (idx === activeIndex) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setActiveIndex(idx);
      setTransitioning(false);
    }, TRANSITION_MS);
  };

  const demo = DEMOS[activeIndex];
  const tone = ACCENT[demo.accent];

  return (
    <div className={clsx('relative mx-auto w-full max-w-2xl', className)}>
      <div
        aria-hidden
        className='absolute -inset-7 -z-10 rounded-[2rem] bg-[rgba(255,255,255,0.65)] blur-2xl dark:bg-[rgba(255,255,255,0.035)]'
      />
      <div
        className={clsx(
          'overflow-hidden rounded-[1.25rem] border backdrop-blur-xl',
          'border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.82)] shadow-[0_28px_80px_-46px_rgba(15,23,42,0.44),inset_0_1px_0_rgba(255,255,255,0.9)]',
          'dark:border-[rgba(255,255,255,0.16)] dark:bg-[rgba(15,23,42,0.78)] dark:shadow-[0_24px_70px_-42px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]',
        )}
      >
        {/* Tab strip */}
        <div
          className={clsx(
            'flex min-h-12 items-center gap-1 border-b px-2 sm:gap-2 sm:px-4',
            'border-border/45 bg-[rgba(255,255,255,0.28)] dark:border-[rgba(255,255,255,0.10)] dark:bg-[rgba(255,255,255,0.045)]',
          )}
        >
          {DEMOS.map((item, idx) => {
            const t = ACCENT[item.accent];
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(idx)}
                className={clsx(
                  'relative -mb-px flex h-12 items-center gap-1.5 border-b-2 px-2.5 text-[11px] font-medium tracking-wide transition-colors sm:px-3 sm:text-[12px]',
                  isActive
                    ? `${t.activeBorder} ${t.activeText}`
                    : 'text-semi-color-text-2 hover:text-semi-color-text-0 border-transparent',
                )}
              >
                {item.label}
              </button>
            );
          })}
          <div className='ml-auto flex items-center gap-2 pr-2 sm:pr-3'>
            <span className='inline-block size-1.5 rounded-full bg-[rgb(16,185,129)] shadow-[0_0_8px_rgba(16,185,129,0.45)]' />
            <span className='text-semi-color-text-2 font-mono text-[10px] tracking-wider uppercase'>
              200 ok
            </span>
          </div>
        </div>

        {/* Endpoint row */}
        <div
          className={clsx(
            'flex items-center gap-3 border-b px-5 py-3.5',
            'border-border/35 dark:border-white/[0.05]',
          )}
        >
          <span
            className={clsx(
              'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em]',
              tone.badge,
            )}
          >
            {demo.method}
          </span>
          <code
            className={clsx(
              'text-semi-color-text-1 truncate font-mono text-[12.5px] transition-opacity duration-200',
              transitioning ? 'opacity-0' : 'opacity-100',
            )}
          >
            {demo.endpoint}
          </code>
        </div>

        {/* Body */}
        <div className='grid h-[410px] grid-rows-[242px_minmax(0,1fr)] font-mono text-[12.5px] leading-[1.58]'>
          {/* Request */}
          <div className='relative px-5 py-[18px]'>
            <SectionLabel>Request</SectionLabel>
            <div
              className={clsx(
                'mt-2 transition-opacity duration-200',
                transitioning ? 'opacity-0' : 'opacity-100',
              )}
            >
              <CodeLine>
                <span className='font-medium text-[rgb(5,150,105)] dark:text-[rgb(52,211,153)]'>
                  curl
                </span>{' '}
                <span className='text-[rgb(37,99,235)] dark:text-[rgb(96,165,250)]'>
                  -X
                </span>{' '}
                <span className='text-[rgb(37,99,235)] dark:text-[rgb(96,165,250)]'>
                  POST
                </span>{' '}
                <span className='text-[rgb(180,83,9)] dark:text-[rgb(252,211,77)]'>
                  &quot;{demo.endpoint}&quot;
                </span>{' '}
                <span className='text-semi-color-text-2'>{'\\'}</span>
              </CodeLine>
              {demo.headers.map((h) => (
                <CodeLine key={h} indent={2}>
                  <span className='text-[rgb(37,99,235)] dark:text-[rgb(96,165,250)]'>
                    -H
                  </span>{' '}
                  <span className='text-[rgb(180,83,9)] dark:text-[rgb(252,211,77)]'>
                    {h}
                  </span>{' '}
                  <span className='text-semi-color-text-2'>{'\\'}</span>
                </CodeLine>
              ))}
              <CodeLine indent={2}>
                <span className='text-[rgb(37,99,235)] dark:text-[rgb(96,165,250)]'>
                  -d
                </span>{' '}
                <span className='text-[rgb(180,83,9)] dark:text-[rgb(252,211,77)]'>
                  &apos;{'{'}
                </span>
              </CodeLine>
              {demo.request.map((line, i) => (
                <CodeLine key={i} indent={4}>
                  {tokenizeLine(line)}
                </CodeLine>
              ))}
              <CodeLine indent={2}>
                <span className='text-[rgb(180,83,9)] dark:text-[rgb(252,211,77)]'>
                  {'}'}&apos;
                </span>
              </CodeLine>
            </div>
          </div>

          {/* Response */}
          <div
            className={clsx(
              'relative border-t px-5 py-4',
              'border-border/35 bg-[rgba(255,255,255,0.24)] dark:border-[rgba(255,255,255,0.10)] dark:bg-[rgba(255,255,255,0.035)]',
            )}
          >
            <SectionLabel>Response</SectionLabel>
            <div
              className={clsx(
                'mt-2 transition-opacity duration-200',
                transitioning ? 'opacity-0' : 'opacity-100',
              )}
            >
              {demo.response.map((line, i) => (
                <CodeLine key={i}>{renderResponseLine(line, demo)}</CodeLine>
              ))}
            </div>
          </div>
        </div>

        {/* Footer metrics */}
        <div
          className={clsx(
            'flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3',
            'border-border/35 bg-[rgba(255,255,255,0.34)] dark:border-[rgba(255,255,255,0.10)] dark:bg-[rgba(255,255,255,0.045)]',
          )}
        >
          <div className='text-semi-color-text-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tabular-nums'>
            <span className='flex items-center gap-1'>
              <span className='font-mono'>{demo.latency}</span>
              <span className='tracking-wider uppercase'>ms</span>
            </span>
            <span className='bg-semi-color-text-2 size-1 rounded-full' />
            <span className='flex items-center gap-1'>
              <span className='font-mono'>{demo.tokens}</span>
              <span className='tracking-wider uppercase'>tokens</span>
            </span>
            <span className='bg-semi-color-text-2 size-1 rounded-full' />
            <span className='flex items-center gap-1'>
              <span className='tracking-wider uppercase'>cost</span>
              <span className='font-mono'>
                ${(demo.tokens * 0.00003).toFixed(5)}
              </span>
            </span>
          </div>
          <span className='text-semi-color-text-2 font-mono text-[10px] tracking-wider uppercase'>
            stream · sse
          </span>
        </div>
      </div>
    </div>
  );
}
