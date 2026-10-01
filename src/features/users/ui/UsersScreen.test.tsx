import { MantineProvider } from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UsersScreen } from './UsersScreen'

const users = [
  { id: 'a1', email: 'admin@aeroflow.local', role: 'admin' },
  { id: 'd1', email: 'dispatcher@aeroflow.local', role: 'dispatcher' },
  { id: 'o1', email: 'operator@aeroflow.local', role: null },
]

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: status < 300, data, errors: [], message: 'Conflict' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockApi(options: { lastAdmin?: boolean } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (method === 'PATCH') {
      return options.lastAdmin ? json(null, 409) : json({ ...users[0], ...JSON.parse(String(init?.body)) })
    }
    if (method === 'POST' && url.endsWith('/admin/users')) {
      return json({ id: 'n1', ...JSON.parse(String(init?.body)) }, 201)
    }
    if (method === 'POST') return new Response(null, { status: 204 })

    return json(users)
  })
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

const calls = (fetchMock: ReturnType<typeof mockApi>, method: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === method)

function renderScreen() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MantineProvider env="test">
        <Notifications />
        <UsersScreen />
      </MantineProvider>
    </QueryClientProvider>,
  )
}

describe('UsersScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    notifications.clean()
  })

  it('lists users with their roles', async () => {
    mockApi()
    renderScreen()

    const table = await screen.findByRole('table', { name: 'Пользователи' })
    expect(within(table).getByText('operator@aeroflow.local')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Роль operator@aeroflow.local' })).toHaveValue('Без доступа')
    expect(screen.getByRole('combobox', { name: 'Роль admin@aeroflow.local' })).toHaveValue('Администратор')
  })

  it('changes a role', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('combobox', { name: 'Роль operator@aeroflow.local' }))
    await user.click(await screen.findByRole('option', { name: 'Диспетчер' }))

    await waitFor(() => expect(calls(fetchMock, 'PATCH')).toHaveLength(1))
    const [url, init] = calls(fetchMock, 'PATCH')[0]
    expect(String(url)).toContain('/admin/users/o1')
    expect(JSON.parse(String(init?.body))).toEqual({ role: 'dispatcher' })
  })

  it('explains why the last administrator cannot lose the role', async () => {
    mockApi({ lastAdmin: true })
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('combobox', { name: 'Роль admin@aeroflow.local' }))
    await user.click(await screen.findByRole('option', { name: 'Без доступа' }))

    expect(await screen.findByText(/последний администратор/)).toBeInTheDocument()
  })

  it('creates a user with a role', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Новый пользователь' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новый пользователь' })
    await user.type(within(dialog).getByRole('textbox', { name: /E-mail/ }), 'new@airport.md')
    await user.type(within(dialog).getByLabelText(/Пароль/), 'password123')
    await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

    await waitFor(() => expect(calls(fetchMock, 'POST')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'POST')[0]
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'new@airport.md',
      password: 'password123',
      role: 'dispatcher',
    })
  })

  it('sets a password', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Задать пароль dispatcher@aeroflow.local' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Новый пароль/), 'new-password-1')
    await user.click(within(dialog).getByRole('button', { name: 'Задать пароль' }))

    await waitFor(() => expect(calls(fetchMock, 'POST')).toHaveLength(1))
    const [url, init] = calls(fetchMock, 'POST')[0]
    expect(String(url)).toContain('/admin/users/d1/password')
    expect(JSON.parse(String(init?.body))).toEqual({ password: 'new-password-1' })
  })
})
