import { Navigate } from 'react-router'

import { paths } from '@/app/router/paths'
import { useCurrentRole } from '@/features/auth/hooks/useCurrentRole'
import { AccessDeniedPage } from '@/pages/access-denied/AccessDeniedPage'

/** The start screen depends on the role: dispatchers work, administrators set up. */
export function HomeRedirect() {
  const role = useCurrentRole()

  if (role === 'admin') return <Navigate to={paths.flightDefinitions} replace />
  if (role === 'dispatcher') return <Navigate to={paths.dispatcher} replace />

  return <AccessDeniedPage />
}
