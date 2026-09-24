import { apiRequest } from '@/shared/api/apiClient'

import type {
  DispatcherActionType,
  DispatcherBoard,
  EmergencyMode,
  EmergencyTemplate,
  FlightOccurrence,
  LaunchOccurrenceResult,
  LaunchPayload,
  OperationalResource,
  PlaybackQueue,
  SupplementaryTemplate,
} from '../model/types'

const actionPathSegment: Record<DispatcherActionType, string> = {
  check_in_opening: 'check-in:open',
  check_in_closing: 'check-in:close',
  boarding_invitation: 'boarding',
  arrival: 'arrival',
}

/**
 * The board of the airport's current operational day (task 027): the day itself
 * and at most one current occurrence per card, including a run started the day
 * before and not yet finished.
 */
export function getDispatcherBoard(): Promise<DispatcherBoard> {
  return apiRequest('/v1/dispatcher/board')
}

/**
 * Ensure the card's first run of the day exists. The server decides the
 * operational date from the airport clock, so the client sends only the card.
 */
export function ensureManualOccurrence(input: {
  flightDefinitionId: string
}): Promise<FlightOccurrence> {
  return apiRequest('/v1/flight-occurrences:ensure-manual', {
    method: 'POST',
    body: input,
  })
}

/**
 * Start a new manual run of the same card on the same day. The server assigns the
 * operational date and the next sequence number, and rejects with 409 when there
 * is no previous run or the previous run has not yet reached the final status of
 * its lifecycle.
 */
export function startNextManualOccurrence(input: {
  flightDefinitionId: string
}): Promise<FlightOccurrence> {
  return apiRequest('/v1/flight-occurrences:start-next-manual', {
    method: 'POST',
    body: input,
  })
}

export function launchOccurrenceAnnouncement(
  occurrenceId: string,
  action: DispatcherActionType,
  payload: LaunchPayload,
): Promise<LaunchOccurrenceResult> {
  return apiRequest(
    `/v1/flight-occurrences/${occurrenceId}/${actionPathSegment[action]}`,
    { method: 'POST', body: payload },
  )
}

export function getFlightAnnouncementLanguages(
  flightDefinitionId: string,
  announcementType: DispatcherActionType,
): Promise<{ languages: string[] }> {
  const params = new URLSearchParams({ flightDefinitionId, announcementType })

  return apiRequest(
    `/v1/flight-announcement-configs/languages?${params.toString()}`,
  )
}

export function getActiveCheckInCounters(): Promise<OperationalResource[]> {
  return apiRequest('/v1/admin/check-in-counters?active=true')
}

export function getActiveGates(): Promise<OperationalResource[]> {
  return apiRequest('/v1/admin/gates?active=true')
}

export function getPlaybackQueue(): Promise<PlaybackQueue> {
  return apiRequest('/v1/dispatcher/playback-queue')
}

/**
 * Remove a waiting announcement from the playback queue (task 018). Cancels the
 * announcement itself — the flight occurrence is not touched. Idempotent on the
 * server: repeating the call returns the already-cancelled announcement.
 */
export function cancelAnnouncement(
  announcementId: string,
): Promise<{ id: string }> {
  return apiRequest(`/v1/announcements/${announcementId}/cancel`, {
    method: 'POST',
  })
}

export function stopAnnouncementPlayback(
  announcementId: string,
): Promise<{ announcementId: string }> {
  return apiRequest(`/v1/dispatcher/playback-queue/${announcementId}/stop`, {
    method: 'POST',
  })
}

/**
 * Active supplementary announcement presets (task 024) — the heir of the legacy САО
 * "Дополнительно" set. The dispatcher launches one of these; it is not tied to a
 * flight.
 */
export function getSupplementaryTemplates(): Promise<SupplementaryTemplate[]> {
  return apiRequest('/v1/dispatcher/supplementary-announcements/templates')
}

/**
 * Launch an airport-wide supplementary announcement (task 024) from a preset. The
 * server assembles the preset's pre-recorded/generated audio for the chosen
 * languages and queues it at priority 50, behind flight announcements. An empty
 * `languages` means all of the preset's configured languages.
 */
export function launchSupplementaryAnnouncement(input: {
  templateId: string
  languages: string[]
}): Promise<{ id: string }> {
  return apiRequest('/v1/dispatcher/supplementary-announcements', {
    method: 'POST',
    body: input,
  })
}

/**
 * Active emergency announcement presets (task 026) — the heir of the legacy САО
 * "Экстренные" set.
 */
export function getEmergencyTemplates(): Promise<EmergencyTemplate[]> {
  return apiRequest('/v1/dispatcher/emergency-announcements/templates')
}

/**
 * Launch an emergency announcement from a preset (task 026). One action, two
 * effects on the server: the announcement is queued at priority 1000 — preempting
 * whatever is sounding — and emergency mode is activated, which suspends the
 * ordinary queue until it is lifted.
 */
export function launchEmergencyAnnouncement(input: {
  templateId: string
  languages: string[]
}): Promise<{ id: string }> {
  return apiRequest('/v1/dispatcher/emergency-announcements', {
    method: 'POST',
    body: input,
  })
}

/** Emergency mode as playback last reported it — the source of the panel banner. */
export function getEmergencyMode(): Promise<EmergencyMode> {
  return apiRequest('/v1/dispatcher/emergency-announcements/mode')
}

/**
 * Lift emergency mode. Neutral operator action: no announcement is cancelled, the
 * ordinary queue simply resumes. Eventual — the banner clears once playback confirms.
 */
export function deactivateEmergencyMode(): Promise<{ requested: boolean }> {
  return apiRequest('/v1/dispatcher/emergency-announcements:deactivate', {
    method: 'POST',
  })
}
