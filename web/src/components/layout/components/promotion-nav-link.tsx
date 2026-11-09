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
import { Sparkles } from 'lucide-react'

import type { TopNavLink } from '../types'

export function PromotionNavContent(props: {
  link: TopNavLink
  title: string
}) {
  if (props.link.variant !== 'promotion') {
    return props.title
  }

  return (
    <>
      <Sparkles className='size-3.5' aria-hidden='true' />
      <span>{props.title}</span>
      <span
        className='absolute end-1.5 top-1 size-1.5 rounded-full bg-rose-500 dark:bg-rose-400'
        aria-hidden='true'
      />
    </>
  )
}
