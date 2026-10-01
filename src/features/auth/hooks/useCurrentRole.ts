import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getCurrentUser } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/model/authStore'
import { claimsFor, userRole, type AppRole } from '@/features/auth/model/roles'

export const currentUserKey = ['auth', 'me'] as const

/** The signed-in user's role as the session knows it. */
export function useCurrentRole(): AppRole | null {
  return useAuthStore((state) => userRole(state.session?.user))
}

/**
 * Keeps the session's role in step with the server: an administrator may change
 * it while this tab is open. Mounted once, in the protected layout.
 */
export function useSyncCurrentUser() {
  const updateUser = useAuthStore((state) => state.updateUser)
  const query = useQuery({
    queryKey: currentUserKey,
    queryFn: getCurrentUser,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (query.data) {
      updateUser({ id: query.data.id, email: query.data.email, roles: claimsFor(query.data.role) })
    }
  }, [query.data, updateUser])
}
