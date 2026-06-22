import { describe, expect, it } from 'vitest'

import { buildFlightDefinitionQuery } from './flightDefinitionApi'

describe('buildFlightDefinitionQuery', () => {
  it('serializes all supported list filters', () => {
    const query = buildFlightDefinitionQuery({
      search: '5F',
      direction: 'departure',
      active: false,
      page: 3,
      limit: 20,
    })

    expect(new URLSearchParams(query)).toEqual(
      new URLSearchParams({
        search: '5F',
        direction: 'departure',
        active: 'false',
        page: '3',
        limit: '20',
      }),
    )
  })

  it('omits optional filters', () => {
    expect(
      buildFlightDefinitionQuery({ page: 1, limit: 20 }),
    ).toBe('page=1&limit=20')
  })
})

