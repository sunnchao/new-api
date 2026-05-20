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
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import { API_KEY_STATUS } from '@/features/keys/constants'
import type { ApiKey } from '@/features/keys/types'

/**
 * Get the list of enabled API keys available for chat selection.
 */
export function useEnabledChatTokens(enabled: boolean) {
  const userId = useAuthStore((state) => state.auth.user?.id)

  return useQuery<ApiKey[]>({
    queryKey: ['chat-enabled-tokens', userId],
    queryFn: async () => {
      const result = await getApiKeys({ p: 1, size: 50 })
      if (!result.success) {
        throw new Error(result.message || 'Failed to load API keys')
      }
      const items = result.data?.items ?? []
      return items.filter((item) => item.status === API_KEY_STATUS.ENABLED)
    },
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch the unmasked key for the given token id.
 */
export function useChatTokenKey(tokenId: number | null) {
  const userId = useAuthStore((state) => state.auth.user?.id)

  return useQuery<string>({
    queryKey: ['chat-token-key', userId, tokenId],
    queryFn: async () => {
      if (tokenId == null) throw new Error('No token selected')
      const keyResult = await fetchTokenKey(tokenId)
      if (!keyResult.success || !keyResult.data?.key) {
        throw new Error(keyResult.message || 'Failed to load API key')
      }
      return `sk-${keyResult.data.key}`
    },
    enabled: tokenId != null && Boolean(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
