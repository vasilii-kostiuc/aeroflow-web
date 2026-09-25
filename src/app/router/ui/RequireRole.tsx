import type { PropsWithChildren } from 'react'

import { useCurrentRole } from '@/features/auth/hooks/useCurrentRole'
import { hasRole, type AppRole } from '@/features/auth/model/roles'
import { AccessDeniedPage } from '@/pages/access-denied/AccessDeniedPage'

/**
 * Shows the route only to users whose role covers `role` (task 033). A convenience
 * for the interface — the backend enforces the same matrix on every request.
 */
export function RequireRole({ role, children }: PropsWithChildren<{ role: AppRole }>) {
  const current = useCurrentRole()

  return hasRole(current, role) ? children : <AccessDeniedPage />
}
