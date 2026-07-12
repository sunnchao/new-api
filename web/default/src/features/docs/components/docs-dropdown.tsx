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
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { DocsMenuItem } from '../lib/docs-menu-items'

type DocsDropdownProps = {
  items: DocsMenuItem[]
  triggerClassName?: string
  contentClassName?: string
  /** Visual style for the trigger button */
  variant?: 'nav' | 'hero' | 'outline'
  showIcon?: boolean
  align?: 'start' | 'center' | 'end'
  label?: string
}

/**
 * Shared Docs secondary menu used by top navigation and homepage hero.
 */
export function DocsDropdown(props: DocsDropdownProps) {
  const { t } = useTranslation()
  const label = props.label ?? t('Docs')
  const variant = props.variant ?? 'nav'

  let triggerClassName = cn(
    'text-muted-foreground hover:text-foreground inline-flex h-auto items-center gap-1 rounded-lg bg-transparent px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200',
    props.triggerClassName
  )
  if (variant === 'hero') {
    triggerClassName = cn(
      'group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-lg px-5 text-sm font-medium',
      props.triggerClassName
    )
  } else if (variant === 'outline') {
    triggerClassName = cn(
      'border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium',
      props.triggerClassName
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === 'nav' ? (
            <button type='button' className={triggerClassName} />
          ) : (
            <Button variant='outline' className={triggerClassName} />
          )
        }
      >
        {props.showIcon !== false && (variant === 'hero' || variant === 'outline') ? (
          <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
        ) : null}
        <span>{label}</span>
        <ChevronDown className='size-3.5 opacity-60' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={props.align ?? 'start'}
        sideOffset={8}
        className={cn('min-w-64 p-1.5', props.contentClassName)}
      >
        <DropdownMenuLabel className='px-2 py-1.5 text-xs'>
          {t('Configuration tutorials')}
        </DropdownMenuLabel>
        {props.items
          .filter((item) => !item.external)
          .map((item) => (
            <DropdownMenuItem
              key={item.href}
              className='cursor-pointer flex-col items-start gap-0.5 px-2 py-2'
              render={<Link to={item.href} />}
            >
              <span className='text-sm font-medium'>{t(item.title)}</span>
              {item.description ? (
                <span className='text-muted-foreground text-xs leading-snug'>
                  {t(item.description)}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        {props.items
          .filter((item) => item.external)
          .map((item) => (
            <DropdownMenuItem
              key={item.href}
              className='cursor-pointer gap-2 px-2 py-2'
              render={
                <a
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                />
              }
            >
              <span className='flex-1 text-sm font-medium'>{t(item.title)}</span>
              <ExternalLink className='text-muted-foreground size-3.5' />
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
