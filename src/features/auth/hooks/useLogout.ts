import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { queryClient } from '@/app/providers/queryClient'
import { paths } from '@/app/router/paths'
import { logout } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/model/authStore'

export function useLogout() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const clearSession = useAuthStore((state) => state.clearSession)

  return useMutation({
    mutationFn: async () => {
      if (session !== null) {
        await logout(session.refreshToken)
      }
    },
    onSettled: () => {
      clearSession()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  })
}
