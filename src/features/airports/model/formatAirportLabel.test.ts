import { describe, expect, it } from 'vitest'

import { formatAirportLabel } from './formatAirportLabel'

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
