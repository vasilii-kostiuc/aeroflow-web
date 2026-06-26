import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  ensureManualOccurrence,
  launchOccurrenceAnnouncement,
} from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'
import type {
  BoardFlight,
  DispatcherActionType,
  LaunchOccurrenceResult,
  LaunchPayload,
} from '../model/types'

export type LaunchVariables = {
  flight: BoardFlight
  action: DispatcherActionType
  operationalDate: string
  payload: LaunchPayload
}

/**
 * Launch a flight announcement: ensure today's occurrence exists for the card,
 * then run the action transition on it. Both steps are idempotent-friendly so a
 * double click does not create duplicates.
 */
export function useLaunchAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<LaunchOccurrenceResult, Error, LaunchVariables>({
    mutationFn: async ({ flight, action, operationalDate, payload }) => {
      const occurrenceId =
        flight.occurrenceId ??
        (
          await ensureManualOccurrence({
            flightDefinitionId: flight.flightDefinitionId,
            operationalDate,
          })
        ).id

      return launchOccurrenceAnnouncement(occurrenceId, action, payload)
    },
    onSuccess: (_result, { operationalDate }) => {
      void queryClient.invalidateQueries({
        queryKey: dispatcherKeys.occurrences(operationalDate),
      })
    },
  })
}
