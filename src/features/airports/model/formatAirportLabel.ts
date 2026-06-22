import type { Airport } from './types'

export function formatAirportLabel(
  airport: Pick<Airport, 'cityName' | 'name' | 'code'>,
): string {
  return `${airport.cityName} — ${airport.name} (${airport.code})`
}
