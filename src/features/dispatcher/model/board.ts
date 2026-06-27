import type { FlightDefinition } from '@/features/flight-definitions/model/types'

import type {
  BoardFlight,
  DispatcherActionType,
  DispatcherOccurrence,
} from './types'

/**
 * Merge active flight definitions with today's occurrences into board cards.
 *
 * The board is definition-driven: every active card is shown, and the status is
 * taken from its occurrence for the day when one exists, otherwise the card is
 * "not_started" (no occurrence yet). Occurrences for inactive/unknown
 * definitions are ignored.
 */
export function buildBoardFlights(
  definitions: FlightDefinition[],
  occurrences: DispatcherOccurrence[],
): BoardFlight[] {
  const byDefinition = new Map<string, DispatcherOccurrence>()
  for (const occurrence of occurrences) {
    byDefinition.set(occurrence.flightDefinitionId, occurrence)
  }

  return definitions.map((definition) => {
    const occurrence = byDefinition.get(definition.id)

    return {
      flightDefinitionId: definition.id,
      flightNumber: definition.flightNumber,
      direction: definition.direction,
      originAirportCode: definition.originAirportCode,
      destinationAirportCode: definition.destinationAirportCode,
      occurrenceId: occurrence?.id ?? null,
      status: occurrence?.status ?? 'not_started',
    }
  })
}

/**
 * Lifecycle-only eligibility (v1): a card is eligible for an action when its
 * direction and current status allow the underlying transition. Config/template
 * readiness is not pre-checked here and surfaces at launch time as a 422.
 */
export function isEligibleForAction(
  action: DispatcherActionType,
  flight: BoardFlight,
): boolean {
  const requiredDirection = action === 'arrival' ? 'arrival' : 'departure'
  if (flight.direction !== requiredDirection) return false

  switch (action) {
    case 'check_in_opening':
    case 'arrival':
      return flight.status === 'not_started' || flight.status === 'scheduled'
    case 'check_in_closing':
      return flight.status === 'check_in_open'
    case 'boarding_invitation':
      return flight.status === 'check_in_closed'
  }
}

export function filterEligibleFlights(
  action: DispatcherActionType,
  flights: BoardFlight[],
): BoardFlight[] {
  return flights.filter((flight) => isEligibleForAction(action, flight))
}

/**
 * A card may start a new run once its latest occurrence reached the final status
 * of its lifecycle: boarding (departure) or arrival_announced (arrival).
 * completed/cancelled are included for forward compatibility but are not yet
 * reachable in the manual flow, so they do not appear on the board today.
 */
export function isEligibleForStartNextRun(flight: BoardFlight): boolean {
  return (
    flight.status === 'boarding' ||
    flight.status === 'arrival_announced' ||
    flight.status === 'completed' ||
    flight.status === 'cancelled'
  )
}

export function filterStartNextFlights(flights: BoardFlight[]): BoardFlight[] {
  return flights.filter(isEligibleForStartNextRun)
}

export function matchesSearch(flight: BoardFlight, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (!term) return true

  return (
    flight.flightNumber.toLowerCase().includes(term) ||
    flight.originAirportCode.toLowerCase().includes(term) ||
    flight.destinationAirportCode.toLowerCase().includes(term)
  )
}
