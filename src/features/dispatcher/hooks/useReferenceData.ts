import { useQuery } from '@tanstack/react-query'

import {
  getActiveCheckInCounters,
  getActiveGates,
  getFlightAnnouncementLanguages,
} from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'
import type { DispatcherActionType } from '../model/types'

/**
 * Languages configured (and enabled) for the flight's announcement of the chosen
 * action. The dispatcher pre-selects all of them; an empty list means the flight
 * has no enabled config for this announcement type yet.
 */
export function useFlightAnnouncementLanguages(
  flightDefinitionId: string,
  action: DispatcherActionType,
) {
  return useQuery({
    queryKey: dispatcherKeys.announcementLanguages(flightDefinitionId, action),
    queryFn: () => getFlightAnnouncementLanguages(flightDefinitionId, action),
    enabled: flightDefinitionId !== '',
  })
}

export function useActiveCheckInCounters() {
  return useQuery({
    queryKey: dispatcherKeys.checkInCounters,
    queryFn: getActiveCheckInCounters,
  })
}

export function useActiveGates() {
  return useQuery({
    queryKey: dispatcherKeys.gates,
    queryFn: getActiveGates,
  })
}
