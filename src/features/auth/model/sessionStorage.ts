import type { AuthSession } from '@/features/auth/model/types'

const SESSION_STORAGE_KEY = 'aeroflow.auth.session'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const session = value as Record<string, unknown>
  const user = session.user

  return (
    typeof session.accessToken === 'string' &&
    session.accessToken.length > 0 &&
    typeof session.refreshToken === 'string' &&
    session.refreshToken.length > 0 &&
    typeof session.tokenType === 'string' &&
    session.tokenType.length > 0 &&
    typeof session.expiresIn === 'number' &&
    Number.isFinite(session.expiresIn) &&
    typeof user === 'object' &&
    user !== null &&
    typeof (user as Record<string, unknown>).id === 'string' &&
    typeof (user as Record<string, unknown>).email === 'string' &&
    isStringArray((user as Record<string, unknown>).roles)
  )
}

export function readStoredSession(): AuthSession | null {
  try {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)

    if (storedSession === null) {
      return null
    }

    const parsedSession: unknown = JSON.parse(storedSession)

    if (!isAuthSession(parsedSession)) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return parsedSession
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function writeStoredSession(session: AuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
