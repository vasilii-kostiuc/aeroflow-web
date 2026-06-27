import { useMutation, useQueryClient } from '@tanstack/react-query'

import { startNextManualOccurrence } from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'
import type { BoardFlight, FlightOccurrence } from '../model/types'

export type StartNextRunVariables = {
  flight: BoardFlight
  operationalDate: string
}

/**
 * Start a new run of a finished card on the same day. The server-side state guard
 * makes this safe against a double click: a second call while the new run is still
 * scheduled is rejected with 409, so no duplicate occurrence is created.
 */
export function useStartNextRun() {
  const queryClient = useQueryClient()

  return useMutation<FlightOccurrence, Error, StartNextRunVariables>({
    mutationFn: ({ flight, operationalDate }) =>
      startNextManualOccurrence({
        flightDefinitionId: flight.flightDefinitionId,
        operationalDate,
      }),
    onSuccess: (_result, { operationalDate }) => {
      void queryClient.invalidateQueries({
        queryKey: dispatcherKeys.occurrences(operationalDate),
      })
    },
  })
}
