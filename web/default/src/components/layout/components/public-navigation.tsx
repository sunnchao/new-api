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
import { ChevronDown, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { cn } from '@/lib/utils'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'

interface PublicNavigationProps {
  /**
   * Custom navigation links
   * If not provided, will use dynamic links from backend or defaults
   */
  links?: TopNavLink[]
  /**
   * Additional className
   */
  className?: string
}

/**
 * Public navigation component that matches Launch UI template styling
 * Used in PublicHeader for desktop navigation
 */
export function PublicNavigation({
  links: providedLinks,
  className,
}: PublicNavigationProps = {}) {
  const { t } = useTranslation()
  // Use the same logic as AppHeader: prioritize dynamic links from backend
  const dynamicLinks = useTopNavLinks()
  const defaultLinks = providedLinks || defaultTopNavLinks
  const links = dynamicLinks.length > 0 ? dynamicLinks : defaultLinks

  return (
    <nav className={cn('hidden items-center gap-1 md:flex', className)}>
      {links.map((link) => {
        const linkKey = `${link.title}-${link.href}`
        if (link.items && link.items.length > 0) {
          const submenuItems = link.items
          return (
            <DropdownMenu key={linkKey}>
              <DropdownMenuTrigger
                render={
                  <button
                    type='button'
                    className={cn(
                      'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground inline-flex h-9 w-max items-center justify-center gap-1 rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                      link.disabled && 'pointer-events-none opacity-50'
                    )}
                  />
                }
              >
                {t(link.title)}
                <ChevronDown className='size-3.5 opacity-60' aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='min-w-56 p-1.5'>
                {submenuItems.map((item, itemIndex) => {
                  const previous = submenuItems[itemIndex - 1]
                  const showSeparator = Boolean(
                    item.external && previous && !previous.external
                  )
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
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        // Handle external links
        if (link.external) {
          return (
            <a
              key={linkKey}
              href={link.href}
              target='_blank'
              rel='noopener noreferrer'
              className={cn(
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                link.disabled && 'pointer-events-none opacity-50'
              )}
            >
              {t(link.title)}
            </a>
          )
        }
        // Handle internal links
        return (
          <Link
            key={linkKey}
            to={link.href}
            className={cn(
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
              link.disabled && 'pointer-events-none opacity-50'
            )}
          >
            {t(link.title)}
          </Link>
        )
      })}
    </nav>
  )
}
