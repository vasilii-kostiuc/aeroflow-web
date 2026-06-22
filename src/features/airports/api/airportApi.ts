import { apiRequest } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/api/types'

import type {
  Airport,
  AirportCreateInput,
  AirportFilters,
  AirportUpdateInput,
} from '../model/types'

const basePath = '/v1/airports'

export function getAirports(
  filters: AirportFilters,
): Promise<PaginatedResult<Airport>> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.active !== undefined) params.set('active', String(filters.active))

  return apiRequest(`${basePath}?${params}`)
}

export function createAirport(input: AirportCreateInput): Promise<Airport> {
  return apiRequest(basePath, { method: 'POST', body: input })
}

export function updateAirport(
  id: string,
  input: AirportUpdateInput,
): Promise<Airport> {
  return apiRequest(`${basePath}/${id}`, { method: 'PUT', body: input })
}

export function changeAirportStatus(
  id: string,
  active: boolean,
): Promise<Airport> {
  return apiRequest(`${basePath}/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
    body: {},
  })
}
