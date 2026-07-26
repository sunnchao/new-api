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
import { ChevronDown, ExternalLink, Menu } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { TopNavLink } from '../types'

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: TopNavLink[]
}

/**
 * 顶部导航栏组件
 * 在大屏幕显示水平导航，在小屏幕显示下拉菜单
 */
export function TopNav({ className, links, ...props }: TopNavProps) {
  const { t } = useTranslation()

  const normalizedLinks = useMemo(
    () =>
      links.map((link) => ({
        isActive: false,
        disabled: false,
        external: false,
        ...link,
      })),
    [links]
  )

  const renderSubmenuItems = (link: (typeof normalizedLinks)[number]) => {
    const items = link.items
    if (!items?.length) return null
    return items.map((item, itemIndex) => {
      const previous = items[itemIndex - 1]
      const showSeparator = Boolean(item.external && previous && !previous.external)
      return (
        <div key={`${item.title}-${item.href}`}>
          {showSeparator ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem
            className={cn(
              'cursor-pointer',
              !item.external && 'flex-col items-start gap-0.5 py-2'
            )}
            render={
              item.external ? (
                <a
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                />
              ) : (
                <Link to={item.href} />
              )
            }
          >
            <span className='flex w-full items-center gap-2 text-sm font-medium'>
              {t(item.title)}
              {item.external ? (
                <ExternalLink className='text-muted-foreground ms-auto size-3.5' />
              ) : null}
            </span>
            {item.description ? (
              <span className='text-muted-foreground text-xs leading-snug'>
                {t(item.description)}
              </span>
            ) : null}
          </DropdownMenuItem>
        </div>
      )
    })
  }

  return (
    <>
      {/* 移动端下拉菜单 */}
      <div className='lg:hidden'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={<Button size='icon' variant='outline' className='size-7' />}
          >
            <Menu />
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='start' className='min-w-52'>
            {normalizedLinks.map((link) => {
              if (link.items && link.items.length > 0) {
                return (
                  <div key={`${link.title}-group`}>
                    <div className='text-muted-foreground px-2 py-1.5 text-xs font-medium'>
                      {t(link.title)}
                    </div>
                    {renderSubmenuItems(link)}
                  </div>
                )
              }
              return (
                <DropdownMenuItem
                  key={`${link.title}-${link.href}`}
                  render={
                    link.external ? (
                      <a
                        href={link.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={!link.isActive ? 'text-muted-foreground' : ''}
                      >
                        {t(link.title)}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className={!link.isActive ? 'text-muted-foreground' : ''}
                        disabled={link.disabled}
                      >
                        {t(link.title)}
                      </Link>
                    )
                  }
                />
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 桌面端水平导航 */}
      <nav
        className={cn(
          'hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6',
          className
        )}
        {...props}
      >
        {normalizedLinks.map((link) => {
          if (link.items && link.items.length > 0) {
            return (
              <DropdownMenu key={`${link.title}-desktop`}>
                <DropdownMenuTrigger
                  render={
                    <button
                      type='button'
                      className={cn(
                        'hover:text-primary inline-flex items-center gap-1 text-sm font-medium transition-colors',
                        link.isActive ? '' : 'text-muted-foreground'
                      )}
                    />
                  }
                >
                  {t(link.title)}
                  <ChevronDown className='size-3.5 opacity-60' aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='min-w-56 p-1.5'>
                  {renderSubmenuItems(link)}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          if (link.external) {
            return (
              <a
                key={`${link.title}-${link.href}`}
                href={link.href}
                target='_blank'
                rel='noopener noreferrer'
                className={`hover:text-primary text-sm font-medium transition-colors ${link.isActive ? '' : 'text-muted-foreground'}`}
              >
                {t(link.title)}
              </a>
            )
          }

          return (
            <Link
              key={`${link.title}-${link.href}`}
              to={link.href}
              disabled={link.disabled}
              className={`hover:text-primary text-sm font-medium transition-colors ${link.isActive ? '' : 'text-muted-foreground'}`}
            >
              {t(link.title)}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
