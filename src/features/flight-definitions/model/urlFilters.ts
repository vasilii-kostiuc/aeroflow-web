import type {
  FlightDefinitionFilters,
  FlightDirection,
} from './types'

export const flightDefinitionPageLimit = 20

export function parseFlightDefinitionFilters(
  searchParams: URLSearchParams,
): FlightDefinitionFilters {
  const page = Number(searchParams.get('page'))
  const active = searchParams.get('active')
  const direction = searchParams.get('direction')

  return {
    search: searchParams.get('search') || undefined,
    direction:
      direction === 'departure' || direction === 'arrival'
        ? (direction as FlightDirection)
        : undefined,
    active:
      active === 'true' ? true : active === 'false' ? false : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: flightDefinitionPageLimit,
  }
}

export function serializeFlightDefinitionFilters(
  filters: FlightDefinitionFilters,
): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.direction) params.set('direction', filters.direction)
  if (filters.active !== undefined) {
    params.set('active', String(filters.active))
  }
  if (filters.page > 1) params.set('page', String(filters.page))

  return params
}

