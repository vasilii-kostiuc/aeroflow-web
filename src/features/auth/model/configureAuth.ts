import { refreshToken } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/model/authStore'
import { configureApiAuth } from '@/shared/api/apiClient'

export function configureAuth(): void {
  configureApiAuth({
    getAccessToken: () => useAuthStore.getState().session?.accessToken ?? null,
    refreshSession: async () => {
      const session = useAuthStore.getState().session

      if (session === null) {
        throw new Error('No active session')
      }

      const tokenPair = await refreshToken(session.refreshToken)
      useAuthStore.getState().updateTokenPair(tokenPair)
    },
    clearSession: () => useAuthStore.getState().clearSession(),
  })
}
