import { apiRequest } from '@/shared/api/apiClient'

import type {
  FlightDefinition,
  FlightDefinitionFilters,
  FlightDefinitionInput,
  PaginatedResult,
} from '../model/types'

const basePath = '/v1/flight-definitions'

export function buildFlightDefinitionQuery(
  filters: FlightDefinitionFilters,
): string {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.direction) params.set('direction', filters.direction)
  if (filters.active !== undefined) {
    params.set('active', String(filters.active))
  }

  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))

  return params.toString()
}

export function getFlightDefinitions(
  filters: FlightDefinitionFilters,
): Promise<PaginatedResult<FlightDefinition>> {
  return apiRequest(`${basePath}?${buildFlightDefinitionQuery(filters)}`)
}

export function createFlightDefinition(
  input: FlightDefinitionInput,
): Promise<FlightDefinition> {
  return apiRequest(basePath, { method: 'POST', body: input })
}

export function updateFlightDefinition(
  id: string,
  input: FlightDefinitionInput,
): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}`, { method: 'PUT', body: input })
}

export function activateFlightDefinition(
  id: string,
): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}/activate`, {
    method: 'POST',
    body: {},
  })
}

export function deactivateFlightDefinition(
  id: string,
): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}/deactivate`, {
    method: 'POST',
    body: {},
  })
}
