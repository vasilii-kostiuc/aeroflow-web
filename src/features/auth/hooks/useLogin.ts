import { useMutation } from '@tanstack/react-query'

import { login } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/features/auth/model/authStore'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: login,
    onSuccess: setSession,
  })
}
