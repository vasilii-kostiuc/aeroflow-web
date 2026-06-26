import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getFlightDefinitions } from '@/features/flight-definitions/api/flightDefinitionApi'
import { flightDefinitionKeys } from '@/features/flight-definitions/api/flightDefinitionKeys'
import type { FlightDefinitionFilters } from '@/features/flight-definitions/model/types'

import { getDispatcherOccurrences } from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'
import { buildBoardFlights } from '../model/board'

const activeFilters: FlightDefinitionFilters = {
  active: true,
  page: 1,
  limit: 100,
}

export function useDispatcherBoard(operationalDate: string) {
  const definitionsQuery = useQuery({
    queryKey: flightDefinitionKeys.list(activeFilters),
    queryFn: () => getFlightDefinitions(activeFilters),
  })

  const occurrencesQuery = useQuery({
    queryKey: dispatcherKeys.occurrences(operationalDate),
    queryFn: () => getDispatcherOccurrences(operationalDate),
  })

  const flights = useMemo(() => {
    if (!definitionsQuery.data) return []

    return buildBoardFlights(
      definitionsQuery.data.items,
      occurrencesQuery.data ?? [],
    )
  }, [definitionsQuery.data, occurrencesQuery.data])

  return {
    flights,
    isLoading: definitionsQuery.isLoading || occurrencesQuery.isLoading,
    isError: definitionsQuery.isError || occurrencesQuery.isError,
    refetch: () => {
      void definitionsQuery.refetch()
      void occurrencesQuery.refetch()
    },
  }
}
