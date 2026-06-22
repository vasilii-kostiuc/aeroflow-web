import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/model/authStore'
import type { AuthSession } from '@/features/auth/model/types'

const session: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  user: {
    id: 'user-id',
    email: 'dispatcher@example.com',
    roles: ['ROLE_USER'],
  },
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('replaces both tokens atomically and preserves the user', () => {
    useAuthStore.getState().setSession(session)

    useAuthStore.getState().updateTokenPair({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 1200,
    })

    expect(useAuthStore.getState().session).toEqual({
      ...session,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 1200,
    })
  })

  it('clears runtime and persisted state', () => {
    useAuthStore.getState().setSession(session)

    useAuthStore.getState().clearSession()

    expect(useAuthStore.getState().session).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})
