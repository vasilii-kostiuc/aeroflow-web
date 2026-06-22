import { describe, expect, it } from 'vitest'

import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/features/auth/model/sessionStorage'
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

describe('sessionStorage', () => {
  it('stores, restores and clears a session', () => {
    writeStoredSession(session)

    expect(readStoredSession()).toEqual(session)

    clearStoredSession()

    expect(readStoredSession()).toBeNull()
  })

  it('removes malformed session data', () => {
    localStorage.setItem('aeroflow.auth.session', '{"accessToken":42}')

    expect(readStoredSession()).toBeNull()
    expect(localStorage.getItem('aeroflow.auth.session')).toBeNull()
  })

  it('removes invalid JSON', () => {
    localStorage.setItem('aeroflow.auth.session', '{invalid')

    expect(readStoredSession()).toBeNull()
    expect(localStorage.getItem('aeroflow.auth.session')).toBeNull()
  })
})
