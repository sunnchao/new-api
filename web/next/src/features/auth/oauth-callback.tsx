"use client"

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
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import i18next from 'i18next'
import { toast } from 'sonner'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { api, getSelf } from '@/lib/api'
import type { ApiRequestOptions } from '@/lib/api-options'
import { OAuthCallbackScreen } from './components/oauth-callback-screen'
import { OAUTH_BIND_STORAGE_KEY } from './constants'
import { consumeOAuthRedirectForState } from './lib/oauth'
import { saveUserId } from './lib/storage'
import { wechatLoginByCode } from './api'

function setAuthenticatedUser(user: AuthUser) {
  useAuthStore.getState().auth.setUser(user)
  if (user.id != null) {
    saveUserId(user.id)
  }
}

function isOAuthBindPayload(value: unknown): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    'action' in value &&
    (value as { action?: unknown }).action === 'bind'
  )
}

function OAuthLoginCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    ;(async () => {
      const redirect = searchParams.get('redirect') || '/dashboard'
      const provider = searchParams.get('provider')
      const code = searchParams.get('code')

      try {
        if (provider === 'wechat' && code) {
          await wechatLoginByCode(code)
        }

        const res = await getSelf()
        if (res?.success && res.data) {
          setAuthenticatedUser(res.data as AuthUser)
          router.replace(redirect)
          return
        }
      } catch {
        // Fall through to the shared failure path.
      }

      toast.error(i18next.t('OAuth failed'))
      router.replace('/sign-in')
    })()
  }, [router, searchParams])

  return null
}

function ProviderCallback({ provider }: { provider: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'bind'>(() => {
    if (typeof window === 'undefined') return 'login'
    return window.opener ? 'bind' : 'login'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    setMode(window.opener ? 'bind' : 'login')
  }, [])

  useEffect(() => {
    ;(async () => {
      const safeNavigate = (target: string) => {
        router.replace(target)
        setTimeout(() => {
          const normalizedTarget = target.startsWith('/') ? target : `/${target}`
          const currentPath = window.location.pathname + window.location.search
          if (
            currentPath !== normalizedTarget &&
            currentPath !== `${normalizedTarget}/`
          ) {
            window.location.replace(target)
          }
        }, 100)
      }

      const code = searchParams.get('code')
      const state = searchParams.get('state') ?? undefined
      const redirect =
        searchParams.get('redirect') ||
        consumeOAuthRedirectForState(state) ||
        '/dashboard'

      if (!code) {
        toast.error(i18next.t('Missing code'))
        safeNavigate('/sign-in')
        return
      }

      const isBindingFlow = Boolean(window.opener)
      if (isBindingFlow && mode !== 'bind') {
        setMode('bind')
      } else if (!isBindingFlow && mode !== 'login') {
        setMode('login')
      }

      const notifyBindingResult = (status: 'success' | 'error') => {
        try {
          window.localStorage.setItem(
            OAUTH_BIND_STORAGE_KEY,
            JSON.stringify({
              provider,
              status,
              timestamp: Date.now(),
            })
          )
        } catch {
          // Ignore storage write failures.
        }
      }

      const closeBindingWindow = () => {
        window.close()
        setTimeout(() => {
          if (!window.closed) {
            window.location.replace('/profile')
          }
        }, 200)
      }

      const finalizeLogin = async (): Promise<boolean> => {
        try {
          const selfResponse = await getSelf()
          if (selfResponse?.success && selfResponse.data) {
            setAuthenticatedUser(selfResponse.data as AuthUser)
            return true
          }
        } catch {
          // Let the caller handle the login failure.
        }
        return false
      }

      const redirectAfterLogin = (target?: string) => {
        safeNavigate(target || redirect)
        toast.success(i18next.t('Signed in successfully!'))
      }

      const handleBindingFailure = (message: string) => {
        notifyBindingResult('error')
        toast.error(message)
      }

      const handleLoginFailure = async (message: string) => {
        if (await finalizeLogin()) {
          redirectAfterLogin()
          return
        }
        toast.error(message)
        safeNavigate('/sign-in')
      }

      try {
        const res = await api.get(`/api/oauth/${provider}`, {
          params: { code, state },
          skipBusinessError: true,
        } as ApiRequestOptions)

        if (res?.data?.success) {
          const { message } = res.data
          const responseData = res.data?.data ?? null
          const isBindResponse =
            message === 'bind' || isOAuthBindPayload(responseData)
          const loginUser = isBindResponse
            ? null
            : ((responseData ?? null) as AuthUser | null)

          if (isBindResponse) {
            toast.success(i18next.t('Binding successful!'))
            notifyBindingResult('success')
            if (isBindingFlow) {
              closeBindingWindow()
            } else {
              safeNavigate('/profile')
            }
            return
          }

          if (loginUser) {
            setAuthenticatedUser(loginUser)
            redirectAfterLogin()
            return
          }

          if (await finalizeLogin()) {
            redirectAfterLogin()
            return
          }

          toast.error(res?.data?.message || i18next.t('OAuth failed'))
          safeNavigate('/sign-in')
          return
        }

        const message = res?.data?.message || 'OAuth failed'
        if (!isBindingFlow && message === '该 GitHub 账户已被绑定') {
          if (await finalizeLogin()) {
            redirectAfterLogin()
            return
          }
        }

        if (isBindingFlow) {
          handleBindingFailure(message)
        } else {
          await handleLoginFailure(message)
        }
      } catch (error) {
        const message = String(
          (error &&
            typeof error === 'object' &&
            'response' in error &&
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message) ||
          (error instanceof Error ? error.message : undefined) ||
          'OAuth failed'
        )

        if (isBindingFlow) {
          handleBindingFailure(message)
          return
        }
        await handleLoginFailure(message)
      }
    })()
  }, [mode, provider, router, searchParams])

  return <OAuthCallbackScreen provider={provider} mode={mode} />
}

export function OAuthPage() {
  return (
    <Suspense>
      <OAuthLoginCallback />
    </Suspense>
  )
}

export function ProviderOAuthPage({ provider }: { provider: string }) {
  return (
    <Suspense>
      <ProviderCallback provider={provider} />
    </Suspense>
  )
}
