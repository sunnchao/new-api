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
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { cn } from '@/lib/utils'

type TutorialCodeBlockProps = {
  code: string
  label?: string
  className?: string
}

export function TutorialCodeBlock(props: TutorialCodeBlockProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'border-border/60 bg-zinc-950 text-zinc-100 overflow-hidden rounded-xl border shadow-sm',
        props.className
      )}
    >
      <div className='border-border/40 flex items-center justify-between gap-3 border-b bg-zinc-900/80 px-3 py-2'>
        <span className='text-muted-foreground truncate text-xs font-medium tracking-wide'>
          {props.label || t('Terminal')}
        </span>
        <CopyButton
          value={props.code}
          className='text-zinc-300 hover:bg-zinc-800 hover:text-white'
          size='icon'
        />
      </div>
      <pre className='overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre'>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}
