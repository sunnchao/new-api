import { useAuthStore, ROLE } from '@/stores/auth-store'

export function useIsAdmin(): boolean {
  const { user } = useAuthStore((state) => state.auth)
  return (user?.role ?? 0) >= ROLE.ADMIN
}
