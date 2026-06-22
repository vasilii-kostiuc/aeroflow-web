import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changeAirportStatus,
  createAirport,
  getAirports,
  updateAirport,
} from '../api/airportApi'
import type {
  AirportCreateInput,
  AirportFilters,
  AirportUpdateInput,
} from '../model/types'

export const airportKeys = {
  all: ['airports'] as const,
  list: (filters: AirportFilters) => [...airportKeys.all, filters] as const,
}

export function useAirports(filters: AirportFilters) {
  return useQuery({
    queryKey: airportKeys.list(filters),
    queryFn: () => getAirports(filters),
  })
}

function useInvalidateAirports() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: airportKeys.all })
}

export function useCreateAirport() {
  const invalidate = useInvalidateAirports()
  return useMutation({
    mutationFn: (input: AirportCreateInput) => createAirport(input),
    onSuccess: invalidate,
  })
}

export function useUpdateAirport() {
  const invalidate = useInvalidateAirports()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AirportUpdateInput }) =>
      updateAirport(id, input),
    onSuccess: invalidate,
  })
}

export function useChangeAirportStatus() {
  const invalidate = useInvalidateAirports()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      changeAirportStatus(id, active),
    onSuccess: invalidate,
  })
}

