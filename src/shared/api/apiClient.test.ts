import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ApiClientError,
  apiRequest,
  configureApiAuth,
} from '@/shared/api/apiClient'

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: status >= 200 && status < 300,
      data: status >= 200 && status < 300 ? data : null,
      message: status >= 200 && status < 300 ? 'ok' : 'error',
      errors: [],
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

describe('apiClient authentication', () => {
  let accessToken: string | null
  let refreshCalls: number
  let clearCalls: number

  beforeEach(() => {
    accessToken = 'expired-token'
    refreshCalls = 0
    clearCalls = 0

    configureApiAuth({
      getAccessToken: () => accessToken,
      refreshSession: async () => {
        refreshCalls += 1
        await Promise.resolve()
        accessToken = 'fresh-token'
      },
      clearSession: () => {
        clearCalls += 1
        accessToken = null
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds the bearer token to authenticated requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/v1/protected')

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(request.headers).get('Authorization')).toBe(
      'Bearer expired-token',
    )
  })

  it('uses one refresh request for parallel 401 responses and retries both', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(
        token === 'Bearer fresh-token'
          ? jsonResponse({ token })
          : jsonResponse(null, 401),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const results = await Promise.all([
      apiRequest<{ token: string }>('/v1/first'),
      apiRequest<{ token: string }>('/v1/second'),
    ])

    expect(refreshCalls).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(results).toEqual([
      { token: 'Bearer fresh-token' },
      { token: 'Bearer fresh-token' },
    ])
  })

  it('clears the session when refresh fails', async () => {
    configureApiAuth({
      getAccessToken: () => accessToken,
      refreshSession: async () => {
        throw new ApiClientError({ status: 401, message: 'Invalid token' })
      },
      clearSession: () => {
        clearCalls += 1
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, 401)))

    await expect(apiRequest('/v1/protected')).rejects.toMatchObject({
      status: 401,
    })
    expect(clearCalls).toBe(1)
  })
})
