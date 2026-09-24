import type { Airport } from './types'

export function formatAirportLabel(
  airport: Pick<Airport, 'cityName' | 'name' | 'code'>,
): string {
  return `${airport.cityName} — ${airport.name} (${airport.code})`
}

/**
 * Compact form for dense tables: «Лондон (LTN)». The code keeps two airports of one
 * city apart; the full name belongs in a tooltip.
 */
export function formatAirportShortLabel(
  airport: Pick<Airport, 'cityName' | 'code'>,
): string {
  return `${airport.cityName} (${airport.code})`
}
