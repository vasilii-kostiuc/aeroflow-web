import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  ensureManualOccurrence,
  launchOccurrenceAnnouncement,
  startNextManualOccurrence,
} from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'
import { hasFinishedRun } from '../model/board'
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
 * Resolve the occurrence the action should run on:
 *
 * - a finished card (previous run reached its final status) starts a new run, so
 *   the action runs on a fresh occurrence rather than the old, finished one;
 * - otherwise ensure today's occurrence exists (idempotent for the first run) and
 *   reuse the one already on the board.
 */
async function resolveOccurrenceId(
  flight: BoardFlight,
  operationalDate: string,
): Promise<string> {
  if (hasFinishedRun(flight)) {
    return (
      await startNextManualOccurrence({
        flightDefinitionId: flight.flightDefinitionId,
        operationalDate,
      })
    ).id
  }

  return (
    flight.occurrenceId ??
    (
      await ensureManualOccurrence({
        flightDefinitionId: flight.flightDefinitionId,
        operationalDate,
      })
    ).id
  )
}

/**
 * Launch a flight announcement: resolve the occurrence to act on (starting a new
 * run for a finished card), then run the action transition on it. A double click
 * is safe: the button disables while pending, and the server-side state guard
 * rejects a second new run while the first is still in progress.
 */
export function useLaunchAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<LaunchOccurrenceResult, Error, LaunchVariables>({
    mutationFn: async ({ flight, action, operationalDate, payload }) => {
      const occurrenceId = await resolveOccurrenceId(flight, operationalDate)

      return launchOccurrenceAnnouncement(occurrenceId, action, payload)
    },
    onSuccess: (_result, { operationalDate }) => {
      void queryClient.invalidateQueries({
        queryKey: dispatcherKeys.occurrences(operationalDate),
      })
    },
  })
}
