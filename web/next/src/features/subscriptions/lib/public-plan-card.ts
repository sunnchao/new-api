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
export type PublicPlanCardMode = 'catalog' | 'home'

type PublicPlanCardActionOptions = {
  mode: PublicPlanCardMode
  isAuthenticated: boolean
}

export function getPublicPlanCardAction({
  mode,
  isAuthenticated,
}: PublicPlanCardActionOptions): {
  labelKey: 'Subscribe Now' | 'Get Started' | 'Sign in to subscribe'
  href: '/my-subscriptions' | '/sign-up' | '/sign-in'
} {
  if (isAuthenticated) {
    return { labelKey: 'Subscribe Now', href: '/my-subscriptions' }
  }

  if (mode === 'home') {
    return { labelKey: 'Get Started', href: '/sign-up' }
  }

  return { labelKey: 'Sign in to subscribe', href: '/sign-in' }
}
