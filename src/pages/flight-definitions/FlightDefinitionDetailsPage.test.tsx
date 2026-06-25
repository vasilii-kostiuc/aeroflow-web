import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FlightDefinitionDetailsPage } from './FlightDefinitionDetailsPage'

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

const flight = {
  id: '01900000-0000-7000-8000-000000000001',
  flightNumber: '5F123',
  direction: 'departure',
  originAirportCode: 'KIV',
  destinationAirportCode: 'FCO',
  active: true,
  createdAt: '2026-06-22T10:00:00+00:00',
  updatedAt: '2026-06-22T10:00:00+00:00',
}

const airports = {
  items: [
    {
      id: '1',
      code: 'KIV',
      name: 'Chișinău International Airport',
      cityName: 'Chișinău',
      countryName: 'Moldova',
      active: true,
      createdAt: '2026-06-22T10:00:00+00:00',
      updatedAt: '2026-06-22T10:00:00+00:00',
    },
    {
      id: '2',
      code: 'FCO',
      name: 'Fiumicino',
      cityName: 'Rome',
      countryName: 'Italy',
      active: true,
      createdAt: '2026-06-22T10:00:00+00:00',
      updatedAt: '2026-06-22T10:00:00+00:00',
    },
  ],
  pagination: { page: 1, limit: 100, totalItems: 2, totalPages: 1 },
}

function renderPage(initialEntry = `/flight-definitions/${flight.id}`) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <MantineProvider env="test">
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/flight-definitions/:id"
              element={<FlightDefinitionDetailsPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  )
}

describe('FlightDefinitionDetailsPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads and updates flight definition details', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/announcement-configs')) return Promise.resolve(apiResponse([]))
      if (url.includes('/audio-assets')) return Promise.resolve(apiResponse([]))
      if (url.includes('/languages')) return Promise.resolve(apiResponse([]))
      if (url.includes('/airports')) return Promise.resolve(apiResponse(airports))
      if (init?.method === 'PUT') return Promise.resolve(apiResponse(flight))

      return Promise.resolve(apiResponse(flight))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByRole('heading', { name: '5F123' })).toBeInTheDocument()
    const number = screen.getByLabelText(/Номер рейса/)
    await user.clear(number)
    await user.type(number, '5f124')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(putCall).toBeDefined()
    expect(JSON.parse(String(putCall?.[1]?.body))).toMatchObject({
      flightNumber: '5F124',
    })
  })

  it('opens announcement settings from the tab query param', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/announcement-configs')) return Promise.resolve(apiResponse([]))
      if (url.includes('/audio-assets')) return Promise.resolve(apiResponse([]))
      if (url.includes('/languages')) return Promise.resolve(apiResponse([]))
      if (url.includes('/airports')) return Promise.resolve(apiResponse(airports))

      return Promise.resolve(apiResponse(flight))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderPage(`/flight-definitions/${flight.id}?tab=announcements`)

    expect(await screen.findByText('Объявления рейса')).toBeInTheDocument()
    expect(
      await screen.findByRole('tab', { name: /Начало регистрации/ }),
    ).toBeInTheDocument()
  })

  it('shows a retry action when the detail request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse(null, 404))
      .mockResolvedValueOnce(apiResponse(flight))
      .mockResolvedValue(apiResponse(airports))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderPage()

    expect(
      await screen.findByText('Не удалось загрузить карточку'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByRole('heading', { name: '5F123' })).toBeInTheDocument()
  })
})
