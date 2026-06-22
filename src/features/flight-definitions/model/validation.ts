import type { FlightDefinitionInput } from './types'

export const flightNumberPattern = /^[A-Z0-9]{2,3}\d{1,4}$/
export const airportCodePattern = /^[A-Z]{3}$/

export function normalizeFlightDefinitionInput(
  input: FlightDefinitionInput,
): FlightDefinitionInput {
  return {
    ...input,
    flightNumber: input.flightNumber.trim().toUpperCase(),
    originAirportCode: input.originAirportCode.trim().toUpperCase(),
    destinationAirportCode: input.destinationAirportCode.trim().toUpperCase(),
  }
}

export function validateFlightDefinitionInput(
  input: FlightDefinitionInput,
): Partial<Record<keyof FlightDefinitionInput, string>> {
  const normalized = normalizeFlightDefinitionInput(input)
  const errors: Partial<Record<keyof FlightDefinitionInput, string>> = {}

  if (!normalized.flightNumber) {
    errors.flightNumber = 'Введите номер рейса'
  } else if (!flightNumberPattern.test(normalized.flightNumber)) {
    errors.flightNumber = 'Например: 5F123, WZZ42 или AFL100'
  }

  if (!airportCodePattern.test(normalized.originAirportCode)) {
    errors.originAirportCode = 'Введите IATA-код из 3 букв'
  }

  if (!airportCodePattern.test(normalized.destinationAirportCode)) {
    errors.destinationAirportCode = 'Введите IATA-код из 3 букв'
  }

  if (
    normalized.originAirportCode &&
    normalized.originAirportCode === normalized.destinationAirportCode
  ) {
    errors.destinationAirportCode = 'Аэропорты должны различаться'
  }

  return errors
}

