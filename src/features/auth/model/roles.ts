import type { AuthUser } from './types'

/** What a user may do (task 033). No role = signed in, but no access. */
export type AppRole = 'admin' | 'dispatcher'

const ROLE_BY_CLAIM: Record<string, AppRole> = {
  ROLE_ADMIN: 'admin',
  ROLE_DISPATCHER: 'dispatcher',
}

/** Rank for the hierarchy: an administrator can do everything a dispatcher can. */
const RANK: Record<AppRole, number> = { dispatcher: 1, admin: 2 }

export const roleLabels: Record<AppRole, string> = {
  admin: 'Администратор',
  dispatcher: 'Диспетчер',
}

/** The strongest role among the session's role claims, or null. */
export function userRole(user: Pick<AuthUser, 'roles'> | null | undefined): AppRole | null {
  let best: AppRole | null = null
  for (const claim of user?.roles ?? []) {
    const role = ROLE_BY_CLAIM[claim]
    if (role && (best === null || RANK[role] > RANK[best])) best = role
  }

  return best
}

/** Whether `role` covers `required`. Only a UX hint — the backend decides. */
export function hasRole(role: AppRole | null, required: AppRole): boolean {
  return role !== null && RANK[role] >= RANK[required]
}

/** Role claims the way the login response carries them, for a `/me` role. */
export function claimsFor(role: AppRole | null): string[] {
  const claim = Object.entries(ROLE_BY_CLAIM).find(([, value]) => value === role)?.[0]

  return claim ? [claim, 'ROLE_USER'] : ['ROLE_USER']
}
