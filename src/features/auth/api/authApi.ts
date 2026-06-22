import type {
  AuthSession,
  LoginInput,
  TokenPair,
} from '@/features/auth/model/types'
import { apiRequest } from '@/shared/api/apiClient'

export function login(input: LoginInput): Promise<AuthSession> {
  return apiRequest<AuthSession>('/v1/login', {
    method: 'POST',
    body: input,
    authenticated: false,
  })
}

export function refreshToken(refreshTokenValue: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/v1/token/refresh', {
    method: 'POST',
    body: { refreshToken: refreshTokenValue },
    authenticated: false,
    retryAfterRefresh: false,
  })
}

export function logout(refreshTokenValue: string): Promise<void> {
  return apiRequest<void>('/v1/logout', {
    method: 'POST',
    body: { refreshToken: refreshTokenValue },
    authenticated: false,
    retryAfterRefresh: false,
  })
}
