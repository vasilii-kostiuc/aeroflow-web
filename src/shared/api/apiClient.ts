import { env } from '@/shared/config/env'
import type { ApiError, ApiResponse } from '@/shared/api/types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  authenticated?: boolean
  retryAfterRefresh?: boolean
}

type AuthAdapter = {
  getAccessToken: () => string | null
  refreshSession: () => Promise<void>
  clearSession: () => void
}

let authAdapter: AuthAdapter | null = null
let refreshPromise: Promise<void> | null = null

export class ApiClientError extends Error implements ApiError {
  status: number
  code?: string
  violations?: Record<string, string[]>

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
    this.status = error.status
    this.code = error.code
    this.violations = error.violations
  }
}

export function configureApiAuth(adapter: AuthAdapter): void {
  authAdapter = adapter
}

function buildUrl(path: string): string {
  const baseUrl = env.coreApiUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${normalizedPath}`
}

async function parseError(response: Response): Promise<ApiClientError> {
  let message = response.statusText || 'Request failed'
  let code: string | undefined
  const violations: Record<string, string[]> = {}

  try {
    const payload = (await response.json()) as Partial<ApiResponse<unknown>>

    if (typeof payload.message === 'string' && payload.message.length > 0) {
      message = payload.message
    }

    for (const error of payload.errors ?? []) {
      if (error.code && code === undefined) {
        code = error.code
      }

      if (error.field) {
        violations[error.field] = [
          ...(violations[error.field] ?? []),
          error.message,
        ]
      }
    }
  } catch {
    // The status and status text remain useful for non-JSON responses.
  }

  return new ApiClientError({
    status: response.status,
    code,
    message,
    violations: Object.keys(violations).length > 0 ? violations : undefined,
  })
}

async function refreshSession(): Promise<void> {
  if (authAdapter === null) {
    throw new Error('API authentication is not configured')
  }

  refreshPromise ??= authAdapter.refreshSession().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function apiRequest<TData>(
  path: string,
  options: RequestOptions = {},
): Promise<TData> {
  const {
    authenticated = true,
    retryAfterRefresh = true,
    headers,
    body,
    ...requestInit
  } = options
  const requestHeaders = new Headers(headers)

  requestHeaders.set('Accept', 'application/json')

  const isFormData = body instanceof FormData

  if (body !== undefined && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const accessToken = authAdapter?.getAccessToken()

    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      ...requestInit,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    })
  } catch {
    throw new ApiClientError({
      status: 0,
      message: 'Не удалось связаться с сервером',
    })
  }

  if (
    response.status === 401 &&
    authenticated &&
    retryAfterRefresh &&
    authAdapter !== null
  ) {
    try {
      await refreshSession()
    } catch (error) {
      authAdapter.clearSession()
      throw error
    }

    return apiRequest<TData>(path, {
      ...options,
      retryAfterRefresh: false,
    })
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as TData
  }

  const payload = (await response.json()) as ApiResponse<TData>
  return payload.data
}

/**
 * Fetch a binary response (e.g. an audio file) as a Blob, with the same auth token
 * and single refresh-retry as apiRequest. Unlike apiRequest it does not unwrap a
 * JSON envelope — the body is returned as-is.
 */
export async function apiRequestBlob(
  path: string,
  options: { retryAfterRefresh?: boolean } = {},
): Promise<Blob> {
  const { retryAfterRefresh = true } = options
  const requestHeaders = new Headers()
  const accessToken = authAdapter?.getAccessToken()

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path), { headers: requestHeaders })
  } catch {
    throw new ApiClientError({
      status: 0,
      message: 'Не удалось связаться с сервером',
    })
  }

  if (response.status === 401 && retryAfterRefresh && authAdapter !== null) {
    try {
      await refreshSession()
    } catch (error) {
      authAdapter.clearSession()
      throw error
    }

    return apiRequestBlob(path, { retryAfterRefresh: false })
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.blob()
}
