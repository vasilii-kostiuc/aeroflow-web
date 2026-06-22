import type { PropsWithChildren } from 'react'

import { Navigate } from 'react-router'

import { paths } from '@/app/router/paths'
import { useAuthStore } from '@/features/auth/model/authStore'

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const isAuthenticated = useAuthStore((state) => state.session !== null)

  if (isAuthenticated) {
    return <Navigate to={paths.home} replace />
  }

  return children
}
