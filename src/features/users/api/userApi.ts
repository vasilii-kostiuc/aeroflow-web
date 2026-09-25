import type { AppRole } from '@/features/auth/model/roles'
import { apiRequest } from '@/shared/api/apiClient'

import type { CreateUserInput, User } from '../model/types'

export const userKeys = {
  all: ['users'] as const,
}

export function getUsers(): Promise<User[]> {
  return apiRequest('/v1/admin/users')
}

/** 409 = the e-mail is taken; 422 = invalid e-mail or password shorter than 8. */
export function createUser(input: CreateUserInput): Promise<User> {
  return apiRequest('/v1/admin/users', { method: 'POST', body: input })
}

/** 409 = this is the last administrator. */
export function changeUserRole(id: string, role: AppRole | null): Promise<User> {
  return apiRequest(`/v1/admin/users/${id}`, { method: 'PATCH', body: { role } })
}

/** Sets a new password and signs the user out of their other sessions. */
export function setUserPassword(id: string, password: string): Promise<void> {
  return apiRequest(`/v1/admin/users/${id}/password`, { method: 'POST', body: { password } })
}
