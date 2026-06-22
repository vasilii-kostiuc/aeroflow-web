export type AuthUser = {
  id: string
  email: string
  roles: string[]
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export type AuthSession = TokenPair & {
  user: AuthUser
}

export type LoginInput = {
  email: string
  password: string
}
