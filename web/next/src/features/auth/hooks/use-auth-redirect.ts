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
import { useRouter } from 'next/navigation'
import i18n from 'i18next'
import { useAuthStore } from '@/stores/auth-store'
import { getSelf } from '@/lib/api'
import { saveLanguagePreference } from '@/i18n/language'
import type { AuthUser } from '@/stores/auth-store'
import { saveUserId } from '../lib/storage'

function getSavedLanguage(user: AuthUser): string | undefined {
  const userData = user as unknown as Record<string, unknown>
  if (typeof userData.language === 'string') {
    return userData.language
  }

  if (
    userData.setting &&
    typeof userData.setting === 'object' &&
    !Array.isArray(userData.setting)
  ) {
    const language = (userData.setting as { language?: unknown }).language
    return typeof language === 'string' ? language : undefined
  }

  try {
    if (typeof userData.setting !== 'string') return undefined
    const setting = JSON.parse(userData.setting) as { language?: unknown }
    return typeof setting.language === 'string' ? setting.language : undefined
  } catch {
    return undefined
  }
}

/**
 * Hook for handling authentication redirects and user data management
 */
export function useAuthRedirect() {
  const router = useRouter()
  const { auth } = useAuthStore()

  /**
   * Handle successful login
   * @param userData - Optional user data from login response
   * @param redirectTo - Redirect path after login
   */
  const handleLoginSuccess = async (
    userData?: { id?: number } | null,
    redirectTo?: string
  ) => {
    // Save user ID if available
    if (userData?.id) {
      saveUserId(userData.id)
    }

    // Fetch and set user data
    try {
      const self = await getSelf()
      if (self?.success && self.data) {
        const user = self.data as AuthUser
        auth.setUser(user)

        // Update user ID if not already set
        if (user.id) {
          saveUserId(user.id)
        }

        // Restore saved language preference
        const savedLang = getSavedLanguage(user)
        if (savedLang && savedLang !== i18n.language) {
          i18n.changeLanguage(savedLang)
          saveLanguagePreference(savedLang)
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    }

    // Navigate to target page
    const targetPath = redirectTo || '/dashboard'
    router.replace(targetPath)
  }

  /**
   * Redirect to 2FA page
   */
  const redirectTo2FA = (redirectTo?: string) => {
    const query = redirectTo
      ? `?redirect=${encodeURIComponent(redirectTo)}`
      : ''
    router.replace(`/otp${query}`)
  }

  /**
   * Redirect to login page
   */
  const redirectToLogin = () => {
    router.replace('/sign-in')
  }

  /**
   * Redirect to register page
   */
  const redirectToRegister = () => {
    router.replace('/sign-up')
  }

  return {
    handleLoginSuccess,
    redirectTo2FA,
    redirectToLogin,
    redirectToRegister,
  }
}
