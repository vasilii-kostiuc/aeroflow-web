import { describe, expect, it } from 'vitest'

import { formatAirportLabel, formatAirportShortLabel } from './formatAirportLabel'

describe('formatAirportLabel', () => {
  it('distinguishes a specific airport within a city', () => {
    expect(
      formatAirportLabel({
        cityName: 'Лондон',
        name: 'London Luton Airport',
        code: 'LTN',
      }),
    ).toBe('Лондон — London Luton Airport (LTN)')
  })
})

describe('formatAirportShortLabel', () => {
  it('keeps the city and the code for dense tables', () => {
    expect(formatAirportShortLabel({ cityName: 'Лондон', code: 'LTN' })).toBe('Лондон (LTN)')
  })
})
