import type { PropsWithChildren } from 'react'

import { Navigate, useLocation } from 'react-router'

import { paths } from '@/app/router/paths'
import { useAuthStore } from '@/features/auth/model/authStore'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.session !== null)

  if (!isAuthenticated) {
    return (
      <Navigate
        to={paths.login}
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        replace
      />
    )
  }

  return children
}
