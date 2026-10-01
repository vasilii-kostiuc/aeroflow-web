import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/authStore'

import { AppLayout } from './AppLayout'
import { HomeRedirect } from './HomeRedirect'
import { RequireRole } from './RequireRole'

function signIn(roles: string[]) {
  useAuthStore.getState().setSession({
    accessToken: 'token',
    refreshToken: 'refresh',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 'u1', email: 'user@example.com', roles },
  })
}

function stubMe(role: 'admin' | 'dispatcher' | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(
        JSON.stringify({ success: true, data: { id: 'u1', email: 'user@example.com', role }, errors: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ),
  )
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomeRedirect /> },
          { path: '/dispatcher', element: <RequireRole role="dispatcher">Панель</RequireRole> },
          { path: '/flight-definitions', element: <RequireRole role="admin">Справочник рейсов</RequireRole> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MantineProvider env="test">
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>,
  )
}

describe('role routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clearSession()
  })

  it('sends a dispatcher to the panel and hides administration', async () => {
    signIn(['ROLE_DISPATCHER', 'ROLE_USER'])
    stubMe('dispatcher')
    renderAt('/')

    expect(await screen.findByText('Панель')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Панель диспетчера' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Карточки рейсов' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Пользователи' })).not.toBeInTheDocument()
  })

  it('shows «Нет доступа» when a dispatcher opens an admin screen by link', async () => {
    signIn(['ROLE_DISPATCHER', 'ROLE_USER'])
    stubMe('dispatcher')
    renderAt('/flight-definitions')

    expect(await screen.findByText('Нет доступа')).toBeInTheDocument()
    expect(screen.queryByText('Справочник рейсов')).not.toBeInTheDocument()
  })

  it('gives an administrator everything', async () => {
    signIn(['ROLE_ADMIN', 'ROLE_USER'])
    stubMe('admin')
    renderAt('/dispatcher')

    expect(await screen.findByText('Панель')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Карточки рейсов' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Пользователи' })).toBeInTheDocument()
  })

  it('tells a user without a role to ask an administrator', async () => {
    signIn(['ROLE_USER'])
    stubMe(null)
    renderAt('/')

    expect(await screen.findByText(/нет роли/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Панель диспетчера' })).not.toBeInTheDocument()
  })

  it('follows a role change made while the tab is open', async () => {
    signIn(['ROLE_ADMIN', 'ROLE_USER'])
    stubMe('dispatcher')
    renderAt('/flight-definitions')

    // The stored session says admin; /me says the role was lowered meanwhile.
    await waitFor(() => expect(screen.getByText('Нет доступа')).toBeInTheDocument())
    expect(useAuthStore.getState().session?.user.roles).toEqual(['ROLE_DISPATCHER', 'ROLE_USER'])
  })
})
