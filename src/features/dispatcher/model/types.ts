import type { FlightDirection } from '@/features/flight-definitions/model/types'

export type DispatcherActionType =
  | 'check_in_opening'
  | 'check_in_closing'
  | 'boarding_invitation'
  | 'arrival'

/**
 * Every announcement type that can reach the queue screen. `check_in_continuation`
 * is not a manual dispatcher action — opening check-in starts its repeat series on
 * the server — but its job shows up in the queue like any other.
 */
export type AnnouncementType = DispatcherActionType | 'check_in_continuation'

export type OccurrenceStatus =
  | 'scheduled'
  | 'check_in_open'
  | 'check_in_closed'
  | 'boarding'
  | 'arrival_announced'
  | 'completed'
  | 'cancelled'

/** Synthetic status for an active card that has no occurrence yet today. */
export type BoardStatus = 'not_started' | OccurrenceStatus

/** Read-model item from GET /dispatcher/flight-occurrences. */
export type DispatcherOccurrence = {
  id: string
  flightDefinitionId: string
  flightNumber: string
  direction: FlightDirection
  airportCode: string
  airportName: string
  operationalDate: string
  status: OccurrenceStatus
  eligible: boolean
  unavailableReason: string | null
  availableLanguages: string[]
}

/** Persisted occurrence returned by create/ensure/launch endpoints. */
export type FlightOccurrence = {
  id: string
  flightDefinitionId: string
  source: string
  direction: FlightDirection
  operationalDate: string
  sequenceNumber: number
  flightNumber: string
  originAirportCode: string
  destinationAirportCode: string
  status: OccurrenceStatus
  checkInCounters: Array<{ id: string; code: string }>
  gate: { id: string; code: string } | null
  lastAnnouncementId: string | null
}

export type LaunchOccurrenceResult = {
  occurrence: FlightOccurrence
  announcementId: string
}

/** Active gate or check-in counter from the operational directories. */
export type OperationalResource = {
  id: string
  code: string
  displayName: string
  sortOrder: number
  active: boolean
}

export type LaunchPayload = {
  languages: string[]
  checkInCounterIds: string[]
  gateId: string | null
}

/** A flight card on the dispatcher board: definition + today's occurrence status. */
export type BoardFlight = {
  flightDefinitionId: string
  flightNumber: string
  direction: FlightDirection
  originAirportCode: string
  destinationAirportCode: string
  occurrenceId: string | null
  status: BoardStatus
}

/** One row of the playback queue screen (GET /dispatcher/playback-queue). */
export type PlaybackQueueRow = {
  announcementId: string
  jobId: string
  flightNumber: string | null
  announcementType: AnnouncementType
  languages: string[]
  checkInCounters: { id: string; code: string }[]
  gate: { id: string; code: string } | null
  state:
    | 'waiting'
    | 'playing'
    | 'rescheduled'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'interrupted'
  queuedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  failureReason: string | null
  /** Moment the next repeat tick is due; only a `rescheduled` row carries one. */
  nextAt: string | null
}

/** Read model of the playback queue: heir of the legacy Status window. */
export type PlaybackQueue = {
  playing: PlaybackQueueRow | null
  waiting: PlaybackQueueRow[]
  recent: PlaybackQueueRow[]
}
