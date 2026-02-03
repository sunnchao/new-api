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
import React, { useMemo } from 'react';
import { useActualTheme } from '../../context/Theme';

const AuthSideArt = () => {
  const actualTheme = useActualTheme();
  const isDark = actualTheme === 'dark';

  const palette = useMemo(() => {
    if (isDark) {
      return {
        bg: 'transparent',
        c1: '#22d3ee', // Cyan
        c2: '#3b82f6', // Blue
        c3: '#8b5cf6', // Violet
        c4: '#ec4899', // Pink
      };
    }

    return {
      bg: 'transparent',
      c1: '#2dd4bf', // Teal
      c2: '#6366f1', // Indigo
      c3: '#84cc16', // Lime
      c4: '#f97316', // Orange
    };
  }, [isDark]);

  return (
    <div className='auth-shell__side' aria-hidden='true' style={{ backgroundColor: palette.bg }}>
      <svg
        className='auth-side-art'
        viewBox='-120 -120 1240 1240'
        preserveAspectRatio='xMaxYMid slice'
        role='presentation'
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <filter id='blurFilter' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='0' />
          </filter>
        </defs>

        <rect x='-120' y='-120' width='1240' height='1240' fill={palette.bg} />

        <g filter='url(#blurFilter)'>
          {/* Blob 1 - Top Left - Cyan/Teal */}
          <path fill={palette.c1} opacity='0.6'>
            <animate
              attributeName='d'
              dur='25s'
              repeatCount='indefinite'
              values='
                M 300 200 C 450 200 500 350 500 450 C 500 600 400 700 300 700 C 150 700 100 550 100 450 C 100 300 200 200 300 200 Z;
                M 350 250 C 550 250 600 400 600 500 C 600 650 450 750 300 750 C 150 750 50 600 50 500 C 50 350 200 250 350 250 Z;
                M 250 150 C 400 150 450 350 450 500 C 450 700 350 800 250 800 C 100 800 50 600 50 500 C 50 300 150 150 250 150 Z;
                M 300 200 C 450 200 500 350 500 450 C 500 600 400 700 300 700 C 150 700 100 550 100 450 C 100 300 200 200 300 200 Z
              '
            />
          </path>

          {/* Blob 2 - Top/Middle Right - Blue/Indigo */}
          <path fill={palette.c2} opacity='0.6'>
            <animate
              attributeName='d'
              dur='30s'
              repeatCount='indefinite'
              values='
                M 700 200 C 850 200 950 350 950 500 C 950 650 800 800 700 800 C 550 800 500 650 500 500 C 500 350 550 200 700 200 Z;
                M 750 250 C 900 300 1000 450 1000 600 C 1000 750 850 850 700 850 C 500 850 450 700 450 600 C 450 400 600 200 750 250 Z;
                M 650 150 C 800 100 900 300 900 450 C 900 650 750 750 650 750 C 500 750 400 600 400 450 C 400 250 500 200 650 150 Z;
                M 700 200 C 850 200 950 350 950 500 C 950 650 800 800 700 800 C 550 800 500 650 500 500 C 500 350 550 200 700 200 Z
              '
            />
          </path>

          {/* Blob 3 - Bottom Left - Violet/Lime */}
          <path fill={palette.c3} opacity='0.6'>
             <animate
              attributeName='d'
              dur='35s'
              repeatCount='indefinite'
              values='
                 M 500 500 C 650 500 750 600 750 750 C 750 900 600 1000 500 1000 C 350 1000 250 900 250 750 C 250 600 350 500 500 500 Z;
                 M 550 550 C 700 550 800 700 800 800 C 800 950 650 1050 500 1050 C 300 1050 200 900 200 800 C 200 650 400 550 550 550 Z;
                 M 450 450 C 600 450 700 550 700 700 C 700 850 550 950 450 950 C 300 950 200 850 200 700 C 200 550 300 450 450 450 Z;
                 M 500 500 C 650 500 750 600 750 750 C 750 900 600 1000 500 1000 C 350 1000 250 900 250 750 C 250 600 350 500 500 500 Z
              '
            />
          </path>

          {/* Blob 4 - Floating Accent - Pink/Orange */}
           <path fill={palette.c4} opacity='0.5'>
             <animate
              attributeName='d'
              dur='28s'
              repeatCount='indefinite'
              values='
                 M 200 700 C 350 700 400 800 400 900 C 400 1000 300 1050 200 1050 C 100 1050 0 1000 0 900 C 0 800 50 700 200 700 Z;
                 M 250 750 C 400 750 450 850 450 950 C 450 1050 350 1100 250 1100 C 150 1100 50 1050 50 950 C 50 850 100 750 250 750 Z;
                 M 200 700 C 350 700 400 800 400 900 C 400 1000 300 1050 200 1050 C 100 1050 0 1000 0 900 C 0 800 50 700 200 700 Z
              '
            />
          </path>
        </g>
      </svg>
    </div>
  );
};

export default AuthSideArt;
