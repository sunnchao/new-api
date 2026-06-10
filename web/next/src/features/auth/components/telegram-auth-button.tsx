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
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SiTelegram } from 'react-icons/si'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  startTelegramAuth,
  type TelegramAuthData,
} from '../lib/telegram'

type TelegramAuthButtonProps = {
  botName: string
  label: string
  disabled?: boolean
  className?: string
  onAuth: (data: TelegramAuthData) => Promise<void> | void
  onError?: (error: unknown) => void
}

export function TelegramAuthButton({
  botName,
  label,
  disabled = false,
  className,
  onAuth,
  onError,
}: TelegramAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading || disabled) return

    setLoading(true)
    try {
      const data = await startTelegramAuth(botName)
      await onAuth(data)
    } catch (error) {
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type='button'
      variant='outline'
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn('h-11 w-full justify-center gap-2 rounded-lg', className)}
    >
      {loading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <SiTelegram className='h-4 w-4' />
      )}
      {label}
    </Button>
  )
}
