import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/model/authStore'
import { LoginForm } from '@/features/auth/ui/LoginForm'

function renderLoginForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  })

  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  )
}

describe('LoginForm', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession()
    vi.unstubAllGlobals()
  })

  it('validates required fields before sending a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderLoginForm()

    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите email')).toBeInTheDocument()
    expect(screen.getByText('Введите пароль')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a neutral invalid credentials message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            data: null,
            message: 'Invalid credentials',
            errors: [],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(
      screen.getByLabelText('Email'),
      'dispatcher@example.com',
    )
    await user.type(screen.getByLabelText('Пароль'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Неверный email или пароль'),
    ).toBeInTheDocument()
  })
})
