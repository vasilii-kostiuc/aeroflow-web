import { describe, expect, it } from 'vitest'

import {
  normalizeFlightDefinitionInput,
  validateFlightDefinitionInput,
} from './validation'

describe('flight definition validation', () => {
  it('normalizes user input before sending it', () => {
    expect(
      normalizeFlightDefinitionInput({
        flightNumber: ' 5f123 ',
        direction: 'departure',
        originAirportCode: ' kiv ',
        destinationAirportCode: 'fco',
      }),
    ).toEqual({
      flightNumber: '5F123',
      direction: 'departure',
      originAirportCode: 'KIV',
      destinationAirportCode: 'FCO',
    })
  })

  it('rejects invalid formats and equal airports', () => {
    expect(
      validateFlightDefinitionInput({
        flightNumber: 'invalid',
        direction: 'arrival',
        originAirportCode: 'KIV',
        destinationAirportCode: 'KIV',
      }),
    ).toEqual({
      flightNumber: 'Например: 5F123, WZZ42 или AFL100',
      destinationAirportCode: 'Аэропорты должны различаться',
    })
  })
})

