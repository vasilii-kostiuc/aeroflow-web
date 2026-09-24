import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { BoardFlight } from '../model/types'
import { DispatcherFlightList } from './DispatcherFlightList'

function flight(overrides: Partial<BoardFlight> = {}): BoardFlight {
  return {
    flightDefinitionId: 'def-1',
    flightNumber: '5F 123',
    direction: 'departure',
    originAirportCode: 'KIV',
    destinationAirportCode: 'IST',
    occurrenceId: 'occ-1',
    occurrenceDate: '2026-09-24',
    status: 'check_in_open',
    ...overrides,
  }
}

function renderList(flights: BoardFlight[]) {
  render(
    <MantineProvider env="test">
      <DispatcherFlightList
        flights={flights}
        operationalDate="2026-09-25"
        selectedId={null}
        onSelect={() => {}}
        resolveAirportLabel={(code) => code}
      />
    </MantineProvider>,
  )
}

describe('DispatcherFlightList', () => {
  it('marks a run started before midnight with its operational date', () => {
    renderList([flight()])

    expect(screen.getByText('с 24.09')).toBeInTheDocument()
    expect(screen.getByText('Регистрация открыта')).toBeInTheDocument()
  })

  it('does not mark a run of the current operational day', () => {
    renderList([flight({ occurrenceDate: '2026-09-25' })])

    expect(screen.queryByText(/^с \d/)).not.toBeInTheDocument()
  })
})
