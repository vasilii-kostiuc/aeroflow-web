import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FlightDefinitionsPage } from './FlightDefinitionsPage'

function apiResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: status >= 200 && status < 300,
      data: status >= 200 && status < 300 ? data : null,
      message: status >= 200 && status < 300 ? null : 'Request failed',
      errors: [],
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

function listResponse(items: unknown[] = []) {
  return apiResponse({
    items,
    pagination: {
      page: 1,
      limit: 20,
      totalItems: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
  })
}

function renderPage(initialEntry = '/flight-definitions') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <MantineProvider env="test">
      <Notifications />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <FlightDefinitionsPage />
          </MemoryRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>,
  )
}

describe('FlightDefinitionsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows an empty state and sends URL filters to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(listResponse())
    vi.stubGlobal('fetch', fetchMock)

    renderPage(
      '/flight-definitions?search=AF&direction=arrival&active=false&page=2',
    )

    expect(await screen.findByText('Карточки не найдены')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/v1/flight-definitions?search=AF&direction=arrival&active=false&page=2&limit=20',
      ),
      expect.any(Object),
    )
  })

  it('renders a populated catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        listResponse([
          {
            id: '01900000-0000-7000-8000-000000000001',
            flightNumber: '5F123',
            direction: 'departure',
            originAirportCode: 'KIV',
            destinationAirportCode: 'FCO',
            active: true,
            createdAt: '2026-06-22T10:00:00+00:00',
            updatedAt: '2026-06-22T10:00:00+00:00',
          },
        ]),
      ),
    )

    renderPage()

    expect(await screen.findByText('5F123')).toBeInTheDocument()
    expect(screen.getByText('KIV')).toBeInTheDocument()
    expect(screen.getByText('FCO')).toBeInTheDocument()
    expect(screen.getByText('Активна')).toBeInTheDocument()
  })

  it('opens announcement settings directly from the flight actions menu', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/announcement-configs')) return Promise.resolve(apiResponse([]))
      if (url.includes('/audio-assets')) return Promise.resolve(apiResponse([]))
      if (url.includes('/airports')) {
        return Promise.resolve(
          apiResponse({
            items: [],
            pagination: {
              page: 1,
              limit: 100,
              totalItems: 0,
              totalPages: 0,
            },
          }),
        )
      }

      return Promise.resolve(
        listResponse([
          {
            id: '01900000-0000-7000-8000-000000000001',
            flightNumber: '5F123',
            direction: 'departure',
            originAirportCode: 'KIV',
            destinationAirportCode: 'FCO',
            active: true,
            createdAt: '2026-06-22T10:00:00+00:00',
            updatedAt: '2026-06-22T10:00:00+00:00',
          },
        ]),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderPage()

    await user.click(
      await screen.findByRole('button', { name: 'Действия для рейса 5F123' }),
    )
    await user.click(
      await screen.findByRole('menuitem', { name: 'Настроить объявления' }),
    )

    expect(await screen.findByText('Объявления рейса')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Начало регистрации' }),
    ).toBeInTheDocument()
  })

  it('shows a retry action when the list request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse(null, 500))
      .mockResolvedValueOnce(listResponse())
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByText('Не удалось загрузить карточки'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByText('Карточки не найдены')).toBeInTheDocument()
  })
})
