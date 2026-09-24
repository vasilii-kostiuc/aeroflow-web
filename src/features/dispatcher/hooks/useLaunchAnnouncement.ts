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
  payload: LaunchPayload
}

/**
 * Resolve the occurrence the action should run on:
 *
 * - a finished card (previous run reached its final status) starts a new run, so
 *   the action runs on a fresh occurrence rather than the old, finished one;
 * - otherwise reuse the occurrence already on the board (possibly a run carried
 *   over from the previous day), or ensure today's first run exists.
 *
 * The server decides the operational date of a new run (task 027).
 */
async function resolveOccurrenceId(flight: BoardFlight): Promise<string> {
  if (hasFinishedRun(flight)) {
    return (
      await startNextManualOccurrence({
        flightDefinitionId: flight.flightDefinitionId,
      })
    ).id
  }

  return (
    flight.occurrenceId ??
    (
      await ensureManualOccurrence({
        flightDefinitionId: flight.flightDefinitionId,
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
    mutationFn: async ({ flight, action, payload }) => {
      const occurrenceId = await resolveOccurrenceId(flight)

      return launchOccurrenceAnnouncement(occurrenceId, action, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dispatcherKeys.board })
    },
  })
}
