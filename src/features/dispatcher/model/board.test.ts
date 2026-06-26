import { describe, expect, it } from 'vitest'

import type { FlightDefinition } from '@/features/flight-definitions/model/types'

import {
  buildBoardFlights,
  filterEligibleFlights,
  isEligibleForAction,
  matchesSearch,
} from './board'
import type { BoardFlight, DispatcherOccurrence } from './types'

function definition(overrides: Partial<FlightDefinition> = {}): FlightDefinition {
  return {
    id: 'def-1',
    flightNumber: '5F 123',
    direction: 'departure',
    originAirportCode: 'KIV',
    destinationAirportCode: 'IST',
    active: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function occurrence(
  overrides: Partial<DispatcherOccurrence> = {},
): DispatcherOccurrence {
  return {
    id: 'occ-1',
    flightDefinitionId: 'def-1',
    flightNumber: '5F 123',
    direction: 'departure',
    airportCode: 'IST',
    airportName: 'IST',
    operationalDate: '2026-06-26',
    status: 'check_in_open',
    eligible: true,
    unavailableReason: null,
    availableLanguages: [],
    ...overrides,
  }
}

function flight(overrides: Partial<BoardFlight> = {}): BoardFlight {
  return {
    flightDefinitionId: 'def-1',
    flightNumber: '5F 123',
    direction: 'departure',
    originAirportCode: 'KIV',
    destinationAirportCode: 'IST',
    occurrenceId: null,
    status: 'not_started',
    ...overrides,
  }
}

describe('buildBoardFlights', () => {
  it('marks a definition without an occurrence as not_started', () => {
    const [row] = buildBoardFlights([definition()], [])

    expect(row.occurrenceId).toBeNull()
    expect(row.status).toBe('not_started')
  })

  it('overlays the occurrence status when one exists for the day', () => {
    const [row] = buildBoardFlights(
      [definition()],
      [occurrence({ status: 'check_in_open' })],
    )

    expect(row.occurrenceId).toBe('occ-1')
    expect(row.status).toBe('check_in_open')
  })

  it('ignores occurrences without a matching active definition', () => {
    const rows = buildBoardFlights(
      [definition({ id: 'def-1' })],
      [occurrence({ flightDefinitionId: 'other' })],
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('not_started')
  })
})

describe('isEligibleForAction', () => {
  it('allows opening check-in for a not-started departure', () => {
    expect(
      isEligibleForAction('check_in_opening', flight({ status: 'not_started' })),
    ).toBe(true)
  })

  it('rejects opening check-in once it is already open', () => {
    expect(
      isEligibleForAction('check_in_opening', flight({ status: 'check_in_open' })),
    ).toBe(false)
  })

  it('allows closing check-in only when it is open', () => {
    expect(
      isEligibleForAction('check_in_closing', flight({ status: 'check_in_open' })),
    ).toBe(true)
    expect(
      isEligibleForAction('check_in_closing', flight({ status: 'not_started' })),
    ).toBe(false)
  })

  it('allows boarding only after check-in is closed', () => {
    expect(
      isEligibleForAction(
        'boarding_invitation',
        flight({ status: 'check_in_closed' }),
      ),
    ).toBe(true)
  })

  it('rejects arrival for a departure flight and allows it for arrivals', () => {
    expect(
      isEligibleForAction('arrival', flight({ direction: 'departure' })),
    ).toBe(false)
    expect(
      isEligibleForAction(
        'arrival',
        flight({ direction: 'arrival', status: 'not_started' }),
      ),
    ).toBe(true)
  })

  it('rejects departure actions for arrival flights', () => {
    expect(
      isEligibleForAction('check_in_opening', flight({ direction: 'arrival' })),
    ).toBe(false)
  })
})

describe('filterEligibleFlights', () => {
  it('keeps only flights eligible for the action', () => {
    const flights = [
      flight({ flightDefinitionId: 'a', status: 'not_started' }),
      flight({ flightDefinitionId: 'b', status: 'check_in_open' }),
    ]

    const result = filterEligibleFlights('check_in_opening', flights)

    expect(result.map((row) => row.flightDefinitionId)).toEqual(['a'])
  })
})

describe('matchesSearch', () => {
  it('matches by flight number and airport code, case-insensitively', () => {
    const row = flight()

    expect(matchesSearch(row, '')).toBe(true)
    expect(matchesSearch(row, '5f')).toBe(true)
    expect(matchesSearch(row, 'ist')).toBe(true)
    expect(matchesSearch(row, 'zzz')).toBe(false)
  })
})
