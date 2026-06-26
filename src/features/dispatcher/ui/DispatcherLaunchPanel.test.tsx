import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardFlight, OperationalResource } from '../model/types'
import { DispatcherLaunchPanel } from './DispatcherLaunchPanel'

const mocks = vi.hoisted(() => ({
  useLanguages: vi.fn(),
  useFlightAnnouncementLanguages: vi.fn(),
  useActiveCheckInCounters: vi.fn(),
  useActiveGates: vi.fn(),
  useLaunchAnnouncement: vi.fn(),
}))

vi.mock('@/features/languages/hooks/useLanguages', () => ({
  useLanguages: mocks.useLanguages,
}))

vi.mock('../hooks/useReferenceData', () => ({
  useFlightAnnouncementLanguages: mocks.useFlightAnnouncementLanguages,
  useActiveCheckInCounters: mocks.useActiveCheckInCounters,
  useActiveGates: mocks.useActiveGates,
}))

vi.mock('../hooks/useLaunchAnnouncement', () => ({
  useLaunchAnnouncement: mocks.useLaunchAnnouncement,
}))

const counters: OperationalResource[] = [
  {
    id: 'counter-1',
    code: '1',
    displayName: 'Стойка регистрации 1',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'counter-3',
    code: '3',
    displayName: 'Стойка регистрации 3',
    sortOrder: 3,
    active: true,
  },
]

const gates: OperationalResource[] = [
  {
    id: 'gate-a1',
    code: 'A1',
    displayName: 'Выход A1',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'gate-a2',
    code: 'A2',
    displayName: 'Выход A2',
    sortOrder: 2,
    active: true,
  },
]

function flight(overrides: Partial<BoardFlight> = {}): BoardFlight {
  return {
    flightDefinitionId: 'flight-1',
    flightNumber: '5F123',
    direction: 'departure',
    originAirportCode: 'RMO',
    destinationAirportCode: 'IST',
    occurrenceId: 'occurrence-1',
    status: 'not_started',
    ...overrides,
  }
}

function renderPanel(
  props: Partial<ComponentProps<typeof DispatcherLaunchPanel>> = {},
  configuredLanguages: string[] = ['en'],
) {
  const mutate = vi.fn()

  mocks.useLanguages.mockReturnValue({
    data: [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        active: true,
        sortOrder: 1,
      },
      {
        code: 'ro-MD',
        name: 'Română',
        nativeName: 'Română',
        active: true,
        sortOrder: 2,
      },
    ],
  })
  mocks.useFlightAnnouncementLanguages.mockReturnValue({
    data: { languages: configuredLanguages },
    isLoading: false,
  })
  mocks.useActiveCheckInCounters.mockReturnValue({
    data: counters,
    isLoading: false,
  })
  mocks.useActiveGates.mockReturnValue({
    data: gates,
    isLoading: false,
  })
  mocks.useLaunchAnnouncement.mockReturnValue({
    mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  })

  render(
    <MantineProvider env="test">
      <DispatcherLaunchPanel
        action="check_in_opening"
        flight={flight()}
        operationalDate="2026-06-26"
        resolveAirportLabel={(code) => code}
        {...props}
      />
    </MantineProvider>,
  )

  return { mutate }
}

describe('DispatcherLaunchPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('launches check-in opening with clicked counter ids', async () => {
    const user = userEvent.setup()
    const { mutate } = renderPanel()
    const launchButton = screen.getByRole('button', {
      name: 'Запустить объявление',
    })

    expect(launchButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '3' }))

    expect(launchButton).toBeEnabled()

    await user.click(launchButton)

    expect(mutate).toHaveBeenCalledWith({
      flight: expect.objectContaining({ flightDefinitionId: 'flight-1' }),
      action: 'check_in_opening',
      operationalDate: '2026-06-26',
      payload: {
        languages: ['en'],
        checkInCounterIds: ['counter-1', 'counter-3'],
        gateId: null,
      },
    })
  })

  it('pre-selects all configured languages and lets the dispatcher deselect one', async () => {
    const user = userEvent.setup()
    const { mutate } = renderPanel({}, ['ro-MD', 'en'])

    const roButton = screen.getByRole('button', { name: 'RO-MD' })
    const enButton = screen.getByRole('button', { name: 'EN' })
    expect(roButton).toHaveAttribute('aria-pressed', 'true')
    expect(enButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(enButton)

    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(
      screen.getByRole('button', { name: 'Запустить объявление' }),
    )

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ languages: ['ro-MD'] }),
      }),
    )
  })

  it('shows a hint and blocks launch when no languages are configured', () => {
    renderPanel({}, [])

    expect(
      screen.getByText(
        'Для этого объявления не настроены языки. Настройте конфигурацию рейса.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Запустить объявление' }),
    ).toBeDisabled()
  })

  it('launches boarding with the clicked gate id', async () => {
    const user = userEvent.setup()
    const { mutate } = renderPanel({
      action: 'boarding_invitation',
      flight: flight({ status: 'check_in_closed' }),
    })
    const launchButton = screen.getByRole('button', {
      name: 'Запустить объявление',
    })

    expect(launchButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'A2' }))

    expect(launchButton).toBeEnabled()

    await user.click(launchButton)

    expect(mutate).toHaveBeenCalledWith({
      flight: expect.objectContaining({ flightDefinitionId: 'flight-1' }),
      action: 'boarding_invitation',
      operationalDate: '2026-06-26',
      payload: {
        languages: ['en'],
        checkInCounterIds: [],
        gateId: 'gate-a2',
      },
    })
  })
})
