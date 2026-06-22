import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  activateFlightDefinition,
  createFlightDefinition,
  deactivateFlightDefinition,
  getFlightDefinitions,
  updateFlightDefinition,
} from '../api/flightDefinitionApi'
import { flightDefinitionKeys } from '../api/flightDefinitionKeys'
import type {
  FlightDefinitionFilters,
  FlightDefinitionInput,
} from '../model/types'

export function useFlightDefinitions(filters: FlightDefinitionFilters) {
  return useQuery({
    queryKey: flightDefinitionKeys.list(filters),
    queryFn: () => getFlightDefinitions(filters),
  })
}

function useInvalidateFlightDefinitions() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({ queryKey: flightDefinitionKeys.all })
}

export function useCreateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: createFlightDefinition,
    onSuccess: invalidate,
  })
}

export function useUpdateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: FlightDefinitionInput
    }) => updateFlightDefinition(id, input),
    onSuccess: invalidate,
  })
}

export function useActivateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: activateFlightDefinition,
    onSuccess: invalidate,
  })
}

export function useDeactivateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: deactivateFlightDefinition,
    onSuccess: invalidate,
  })
}

