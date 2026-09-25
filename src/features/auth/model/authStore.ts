import { create } from 'zustand'

import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/features/auth/model/sessionStorage'
import type { AuthSession, AuthUser, TokenPair } from '@/features/auth/model/types'

type AuthState = {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  updateTokenPair: (tokenPair: TokenPair) => void
  /** Roles can change while a session lives; the web refreshes them from /me. */
  updateUser: (user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readStoredSession(),
  setSession: (session) => {
    writeStoredSession(session)
    set({ session })
  },
  updateTokenPair: (tokenPair) => {
    set((state) => {
      if (state.session === null) {
        return state
      }

      const session = {
        ...state.session,
        ...tokenPair,
      }

      writeStoredSession(session)
      return { session }
    })
  },
  updateUser: (user) => {
    set((state) => {
      if (state.session === null) {
        return state
      }

      const session = { ...state.session, user }
      writeStoredSession(session)
      return { session }
    })
  },
  clearSession: () => {
    clearStoredSession()
    set({ session: null })
  },
}))
