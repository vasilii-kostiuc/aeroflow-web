import { describe, expect, it } from 'vitest'

import { ALL_FILES, ALL_LANGUAGES } from './types'
import { parseLibraryFilters, writeLibraryFilters } from './urlFilters'

describe('urlFilters', () => {
  it('reads defaults from an empty URL and writes defaults as an empty URL', () => {
    const filters = parseLibraryFilters(new URLSearchParams())

    expect(filters).toEqual({ folder: ALL_FILES, language: ALL_LANGUAGES, source: 'all', search: '' })
    expect(writeLibraryFilters(filters).toString()).toBe('')
  })

  it('round-trips a filtered view and ignores an unknown source', () => {
    const filters = { folder: 'f1', language: 'ru', source: 'generated' as const, search: 'гонг' }

    expect(parseLibraryFilters(writeLibraryFilters(filters))).toEqual(filters)
    expect(parseLibraryFilters(new URLSearchParams('source=bogus')).source).toBe('all')
  })
})
