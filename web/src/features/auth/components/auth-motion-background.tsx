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
const blobs = [
  {
    className: 'auth-motion-blob auth-motion-blob-1',
    fill: 'var(--auth-motion-cyan)',
    opacity: 0.58,
    d: 'M248 112C354 80 450 136 480 234C518 358 420 472 296 468C164 464 82 352 120 232C138 176 184 132 248 112Z',
  },
  {
    className: 'auth-motion-blob auth-motion-blob-2',
    fill: 'var(--auth-motion-indigo)',
    opacity: 0.5,
    d: 'M746 94C860 86 954 178 960 292C966 420 852 516 724 492C596 468 532 342 590 224C620 162 674 100 746 94Z',
  },
  {
    className: 'auth-motion-blob auth-motion-blob-3',
    fill: 'var(--auth-motion-lime)',
    opacity: 0.42,
    d: 'M470 420C594 392 720 460 746 580C776 718 654 828 516 798C386 770 304 648 354 528C376 476 414 434 470 420Z',
  },
  {
    className: 'auth-motion-blob auth-motion-blob-4',
    fill: 'var(--auth-motion-orange)',
    opacity: 0.38,
    d: 'M128 610C220 574 328 620 356 710C392 826 298 914 186 900C88 888 24 802 58 706C72 664 92 626 128 610Z',
  },
]

const styles = `
.auth-motion-background {
  --auth-motion-cyan: oklch(0.78 0.13 195);
  --auth-motion-indigo: oklch(0.62 0.18 278);
  --auth-motion-lime: oklch(0.79 0.17 128);
  --auth-motion-orange: oklch(0.72 0.18 48);

  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in oklch, var(--muted) 70%, transparent) 0%,
      transparent 42%
    ),
    var(--background);
}

.dark .auth-motion-background {
  --auth-motion-cyan: oklch(0.78 0.14 208);
  --auth-motion-indigo: oklch(0.67 0.18 276);
  --auth-motion-lime: oklch(0.75 0.16 158);
  --auth-motion-orange: oklch(0.72 0.17 28);
}

.auth-motion-wash,
.auth-motion-grid,
.auth-motion-art,
.auth-motion-vignette {
  position: absolute;
  inset: 0;
}

.auth-motion-wash {
  background:
    radial-gradient(
      circle at 16% 18%,
      color-mix(in oklch, var(--auth-motion-cyan) 30%, transparent),
      transparent 30%
    ),
    radial-gradient(
      circle at 78% 16%,
      color-mix(in oklch, var(--auth-motion-indigo) 26%, transparent),
      transparent 32%
    ),
    radial-gradient(
      circle at 24% 84%,
      color-mix(in oklch, var(--auth-motion-lime) 22%, transparent),
      transparent 30%
    ),
    radial-gradient(
      circle at 82% 78%,
      color-mix(in oklch, var(--auth-motion-orange) 18%, transparent),
      transparent 28%
    );
}

.auth-motion-grid {
  background-image:
    linear-gradient(
      color-mix(in oklch, var(--foreground) 7%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      color-mix(in oklch, var(--foreground) 7%, transparent) 1px,
      transparent 1px
    );
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, black 0%, transparent 82%);
}

.auth-motion-art {
  width: 100%;
  height: 100%;
  transform: scale(1.04);
}

.auth-motion-blob {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform, opacity;
}

.auth-motion-blob-1 {
  animation: authMotionBlob1 6s ease-in-out infinite;
}

.auth-motion-blob-2 {
  animation: authMotionBlob2 10s ease-in-out infinite;
}

.auth-motion-blob-3 {
  animation: authMotionBlob3 14s ease-in-out infinite;
}

.auth-motion-blob-4 {
  animation: authMotionBlob4 12s ease-in-out infinite;
}

.auth-motion-vignette {
  background:
    linear-gradient(to bottom, transparent 0%, var(--background) 120%),
    radial-gradient(circle at center, transparent 0%, var(--background) 110%);
}

@keyframes authMotionBlob1 {
  0%,
  100% {
    transform: translate3d(-48px, 30px, 0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(64px, -36px, 0) scale(1.08);
    opacity: 0.66;
  }
}

@keyframes authMotionBlob2 {
  0%,
  100% {
    transform: translate3d(52px, -42px, 0) scale(1);
    opacity: 0.44;
  }
  50% {
    transform: translate3d(-72px, 54px, 0) scale(1.06);
    opacity: 0.6;
  }
}

@keyframes authMotionBlob3 {
  0%,
  100% {
    transform: translate3d(-38px, 58px, 0) scale(1);
    opacity: 0.36;
  }
  50% {
    transform: translate3d(74px, -54px, 0) scale(1.07);
    opacity: 0.5;
  }
}

@keyframes authMotionBlob4 {
  0%,
  100% {
    transform: translate3d(48px, 32px, 0) scale(1);
    opacity: 0.32;
  }
  50% {
    transform: translate3d(-78px, -46px, 0) scale(1.05);
    opacity: 0.44;
  }
}

@media (max-width: 640px) {
  .auth-motion-art {
    transform: scale(1.22);
  }

  .auth-motion-grid {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-motion-blob {
    animation: none !important;
  }
}
`

export function AuthMotionBackground() {
  return (
    <div
      aria-hidden='true'
      className='auth-motion-background'
      data-testid='auth-motion-background'
    >
      <style>{styles}</style>
      <div className='auth-motion-wash' />
      <div className='auth-motion-grid' />
      <svg
        className='auth-motion-art'
        viewBox='0 0 1080 900'
        preserveAspectRatio='xMidYMid slice'
        role='presentation'
      >
        <defs>
          <filter
            id='auth-motion-blur'
            x='-40%'
            y='-40%'
            width='180%'
            height='180%'
          >
            <feGaussianBlur stdDeviation='34' />
          </filter>
        </defs>
        <g filter='url(#auth-motion-blur)'>
          {blobs.map((blob) => (
            <path
              key={blob.className}
              className={blob.className}
              d={blob.d}
              fill={blob.fill}
              opacity={blob.opacity}
            />
          ))}
        </g>
      </svg>
      <div className='auth-motion-vignette' />
    </div>
  )
}
