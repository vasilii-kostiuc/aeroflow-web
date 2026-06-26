import { apiRequest } from '@/shared/api/apiClient'

import type {
  DispatcherActionType,
  DispatcherOccurrence,
  FlightOccurrence,
  LaunchOccurrenceResult,
  LaunchPayload,
  OperationalResource,
} from '../model/types'

const actionPathSegment: Record<DispatcherActionType, string> = {
  check_in_opening: 'check-in:open',
  check_in_closing: 'check-in:close',
  boarding_invitation: 'boarding',
  arrival: 'arrival',
}

export function getDispatcherOccurrences(
  operationalDate?: string,
): Promise<DispatcherOccurrence[]> {
  const params = new URLSearchParams()
  if (operationalDate) params.set('operationalDate', operationalDate)

  const query = params.toString()

  return apiRequest(
    `/v1/dispatcher/flight-occurrences${query ? `?${query}` : ''}`,
  )
}

export function ensureManualOccurrence(input: {
  flightDefinitionId: string
  operationalDate: string
}): Promise<FlightOccurrence> {
  return apiRequest('/v1/flight-occurrences:ensure-manual', {
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
