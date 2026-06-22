import { describe, expect, it } from 'vitest'

import {
  parseFlightDefinitionFilters,
  serializeFlightDefinitionFilters,
} from './urlFilters'

describe('flight definition URL filters', () => {
  it('parses supported values and protects pagination defaults', () => {
    expect(
      parseFlightDefinitionFilters(
        new URLSearchParams(
          'search=AF&direction=arrival&active=false&page=2',
        ),
      ),
    ).toEqual({
      search: 'AF',
      direction: 'arrival',
      active: false,
      page: 2,
      limit: 20,
    })

    expect(
      parseFlightDefinitionFilters(
        new URLSearchParams('direction=unknown&page=0'),
      ),
    ).toEqual({
      search: undefined,
      direction: undefined,
      active: undefined,
      page: 1,
      limit: 20,
    })
  })

  it('keeps non-default state in the URL', () => {
    expect(
      serializeFlightDefinitionFilters({
        search: 'WZZ',
        active: true,
        page: 4,
        limit: 20,
      }).toString(),
    ).toBe('search=WZZ&active=true&page=4')
  })
})

