export type FlightDirection = 'departure' | 'arrival'

export type FlightDefinition = {
  id: string
  flightNumber: string
  direction: FlightDirection
  originAirportCode: string
  destinationAirportCode: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type FlightDefinitionInput = Pick<
  FlightDefinition,
  | 'flightNumber'
  | 'direction'
  | 'originAirportCode'
  | 'destinationAirportCode'
>

export type FlightDefinitionFilters = {
  search?: string
  direction?: FlightDirection
  active?: boolean
  page: number
  limit: number
}

