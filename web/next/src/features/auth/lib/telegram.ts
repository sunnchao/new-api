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
export const TELEGRAM_AUTH_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'username',
  'photo_url',
  'auth_date',
  'hash',
  'lang',
] as const

export type TelegramAuthData = Partial<
  Record<(typeof TELEGRAM_AUTH_FIELDS)[number], string>
> & {
  id: string
  hash: string
}

export function sanitizeTelegramAuthData(
  data: Record<string, unknown>
): TelegramAuthData | null {
  const sanitized: Record<string, string> = {}

  for (const field of TELEGRAM_AUTH_FIELDS) {
    const value = data[field]
    if (typeof value === 'string' && value.length > 0) {
      sanitized[field] = value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[field] = String(value)
    }
  }

  // Telegram postMessage payloads include source="telegram-login"; backend
  // HMAC validation signs every query param except hash, so extra keys must
  // never be forwarded.

  if (!sanitized.id || !sanitized.hash) return null
  return sanitized as TelegramAuthData
}

function parseTelegramHash(hash: string): TelegramAuthData | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const params = new URLSearchParams(raw)
  return sanitizeTelegramAuthData(Object.fromEntries(params.entries()))
}

export function buildTelegramOAuthUrl(botName: string): string {
  const url = new URL('https://oauth.telegram.org/authorize')
  url.searchParams.set('bot_id', botName)
  url.searchParams.set('request_write_access', '1')
  return url.toString()
}

export function startTelegramAuth(botName: string): Promise<TelegramAuthData> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Telegram login is only available in the browser'))
      return
    }

    const width = 550
    const height = 450
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const popup = window.open(
      buildTelegramOAuthUrl(botName),
      'telegram_login',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error('Telegram login popup was blocked'))
      return
    }

    let settled = false
    const timers: { poll?: number; close?: number } = {}

    const cleanup = () => {
      if (timers.poll) window.clearInterval(timers.poll)
      if (timers.close) window.clearInterval(timers.close)
      window.removeEventListener('message', handleMessage)
    }

    const complete = (data: TelegramAuthData) => {
      if (settled) return
      settled = true
      cleanup()
      try {
        popup.close()
      } catch {
        // ignore popup close failures
      }
      resolve(data)
    }

    const cancel = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Telegram authorization was cancelled'))
    }

    const inspectPopup = () => {
      if (popup.closed) {
        cancel()
        return
      }

      try {
        const data = parseTelegramHash(popup.location.hash)
        if (data) complete(data)
      } catch {
        // Cross-origin access is expected until Telegram redirects back.
      }
    }

    function handleMessage(event: MessageEvent) {
      const raw = event.data
      if (!raw || typeof raw !== 'object') return
      const payload = raw as Record<string, unknown>
      if (payload.source !== 'telegram-login') return

      const data = sanitizeTelegramAuthData(payload)
      if (data) complete(data)
    }

    window.addEventListener('message', handleMessage)
    timers.poll = window.setInterval(inspectPopup, 500)
    timers.close = window.setInterval(() => {
      if (popup.closed) cancel()
    }, 1000)
  })
}
