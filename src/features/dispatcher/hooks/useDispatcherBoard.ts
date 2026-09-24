import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getFlightDefinitions } from '@/features/flight-definitions/api/flightDefinitionApi'
import { flightDefinitionKeys } from '@/features/flight-definitions/api/flightDefinitionKeys'
import type { FlightDefinitionFilters } from '@/features/flight-definitions/model/types'

import { getDispatcherBoard } from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'
import { buildBoardFlights } from '../model/board'

const activeFilters: FlightDefinitionFilters = {
  active: true,
  page: 1,
  limit: 100,
}

/**
 * Polled so that a new operational day and actions from other workstations reach
 * the board without a reload — the server owns the day (task 027).
 */
const BOARD_POLL_INTERVAL_MS = 15_000

export function useDispatcherBoard() {
  const definitionsQuery = useQuery({
    queryKey: flightDefinitionKeys.list(activeFilters),
    queryFn: () => getFlightDefinitions(activeFilters),
  })

  const boardQuery = useQuery({
    queryKey: dispatcherKeys.board,
    queryFn: getDispatcherBoard,
    refetchInterval: BOARD_POLL_INTERVAL_MS,
  })

  const flights = useMemo(() => {
    if (!definitionsQuery.data) return []

    return buildBoardFlights(
      definitionsQuery.data.items,
      boardQuery.data?.occurrences ?? [],
    )
  }, [definitionsQuery.data, boardQuery.data])

  return {
    flights,
    operationalDate: boardQuery.data?.operationalDate ?? null,
    isLoading: definitionsQuery.isLoading || boardQuery.isLoading,
    isError: definitionsQuery.isError || boardQuery.isError,
    refetch: () => {
      void definitionsQuery.refetch()
      void boardQuery.refetch()
    },
  }
}
