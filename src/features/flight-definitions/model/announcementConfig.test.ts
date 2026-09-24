import { describe, expect, it } from 'vitest'

import {
  languageLabel,
  moveVariant,
  singleAudioAssetId,
  variantSummary,
} from './announcementConfig'
import type { AnnouncementTemplateSegmentInput, AnnouncementVariant } from './types'

function variant(id: string, sortOrder: number, createdAt = '2026-06-22T10:00:00+00:00'): AnnouncementVariant {
  return { id, languageCode: id, sortOrder, segments: [], enabled: true, createdAt, updatedAt: createdAt }
}

function segment(overrides: Partial<AnnouncementTemplateSegmentInput>): AnnouncementTemplateSegmentInput {
  return { sortOrder: 1, type: 'text', audioAssetId: null, slot: null, durationMs: null, text: null, ...overrides }
}

describe('languageLabel', () => {
  it('shows the native name with the code, never a bare code', () => {
    expect(languageLabel({ code: 'en', name: 'English', nativeName: 'English', active: true, sortOrder: 1 })).toBe('English · en')
    expect(languageLabel({ code: 'ru', name: 'Russian', nativeName: 'Русский', active: true, sortOrder: 2 })).toBe('Русский · ru')
  })
})

describe('moveVariant', () => {
  it('swaps neighbours and returns only the variants whose order changes', () => {
    const changes = moveVariant([variant('ru', 1), variant('en', 2), variant('ro', 3)], 'en', -1)

    expect(changes.map(({ variant: v, sortOrder }) => [v.id, sortOrder])).toEqual([
      ['en', 1],
      ['ru', 2],
    ])
  })

  it('renumbers legacy duplicate orders into a clean sequence', () => {
    const changes = moveVariant(
      [variant('ru', 1, '2026-01-01T00:00:00Z'), variant('en', 1, '2026-01-02T00:00:00Z')],
      'ru',
      1,
    )

    expect(changes.map(({ variant: v, sortOrder }) => [v.id, sortOrder])).toEqual([['ru', 2]])
  })

  it('does nothing at the edges', () => {
    expect(moveVariant([variant('ru', 1), variant('en', 2)], 'ru', -1)).toEqual([])
    expect(moveVariant([variant('ru', 1), variant('en', 2)], 'en', 1)).toEqual([])
  })
})

describe('variantSummary', () => {
  it('shows the text of a single text segment', () => {
    expect(variantSummary([segment({ text: 'Внимание!' })], [])).toBe('Внимание!')
  })

  it('lists the parts of a composite variant in order', () => {
    expect(
      variantSummary(
        [
          segment({ sortOrder: 3, type: 'dynamic_slot', slot: 'check_in_counters' }),
          segment({ sortOrder: 1, text: 'Регистрация' }),
          segment({ sortOrder: 2, type: 'pause', durationMs: 300 }),
        ],
        [],
      ),
    ).toBe('«Регистрация» · пауза 300 мс · Стойки регистрации')
  })

  it('plays only a one-segment variant', () => {
    expect(singleAudioAssetId([segment({ audioAssetId: 'a1' })])).toBe('a1')
    expect(singleAudioAssetId([segment({ audioAssetId: 'a1' }), segment({ sortOrder: 2 })])).toBeNull()
  })
})
