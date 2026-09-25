import type { AppRole } from '@/features/auth/model/roles'

/** An AeroFlow account as the administrator sees it; `role: null` = no access. */
export type User = {
  id: string
  email: string
  role: AppRole | null
}

export type CreateUserInput = {
  email: string
  password: string
  role: AppRole | null
}
