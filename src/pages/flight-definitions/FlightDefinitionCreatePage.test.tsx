import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FlightDefinitionCreatePage } from './FlightDefinitionCreatePage'

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

function renderPage() {
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
        <MemoryRouter initialEntries={['/flight-definitions/new']}>
          <FlightDefinitionCreatePage />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  )
}

function LocationProbe() {
  const location = useLocation()

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}

describe('FlightDefinitionCreatePage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a flight definition and navigates to the details page', async () => {
    const created = {
      id: '01900000-0000-7000-8000-000000000001',
      flightNumber: '5F123',
      direction: 'departure',
      originAirportCode: 'KIV',
      destinationAirportCode: 'FCO',
      active: true,
      createdAt: '2026-06-22T10:00:00+00:00',
      updatedAt: '2026-06-22T10:00:00+00:00',
    }
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/airports')) return Promise.resolve(apiResponse(airports))
      if (init?.method === 'POST') return Promise.resolve(apiResponse(created, 201))

      return Promise.resolve(apiResponse(null, 404))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderPage()

    await user.type(await screen.findByLabelText(/Номер рейса/), '5f123')
    await selectOption('Аэропорт отправления', 'Chișinău')
    await selectOption('Аэропорт назначения', 'Rome')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(postCall).toBeDefined()
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({
      flightNumber: '5F123',
      direction: 'departure',
      originAirportCode: 'KIV',
      destinationAirportCode: 'FCO',
    })
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/flight-definitions/01900000-0000-7000-8000-000000000001?tab=details',
      ),
    )
  })

  it('shows API errors near the form', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/airports')) return Promise.resolve(apiResponse(airports))
      if (init?.method === 'POST') {
        return Promise.resolve(apiResponse(null, 409))
      }

      return Promise.resolve(apiResponse(null, 404))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderPage()

    await user.type(await screen.findByLabelText(/Номер рейса/), '5f123')
    await selectOption('Аэропорт отправления', 'Chișinău')
    await selectOption('Аэропорт назначения', 'Rome')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(
      await screen.findByText('Такая карточка рейса уже существует.'),
    ).toBeInTheDocument()
  })
})

async function selectOption(label: string, optionText: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: new RegExp(label) }))
  const options = await screen.findAllByRole('option')
  const option = options.find((element) =>
    element.textContent?.includes(optionText),
  )
  if (!option) {
    throw new Error(`Option containing "${optionText}" was not found.`)
  }
  await user.click(option)
}
