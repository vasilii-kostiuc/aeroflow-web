import { describe, expect, it } from 'vitest'

import { assetsInView, filterAssets, isFlatView } from './filters'
import { asset, folder } from './testData'
import { ALL_FILES, ALL_LANGUAGES, NO_FOLDER } from './types'

const folders = [folder('dep', 'Вылеты'), folder('su', 'SU 1234', 'dep')]
const assets = [
  asset('gong', 'Гонг', { folderId: 'dep', languageCode: 'ru' }),
  asset('gate', 'выход A12', { folderId: 'su', languageCode: 'en', name: 'gate-a12-en.wav' }),
  asset('tts', 'Уважаемые пассажиры', { source: 'generated' }),
  asset('old', 'Старый', { active: false }),
]
const noFilters = { language: ALL_LANGUAGES, source: 'all' as const, search: '' }

describe('filters', () => {
  it('keeps active assets matching language, source and search', () => {
    expect(filterAssets(assets, noFilters).map((a) => a.id)).toEqual(['gong', 'gate', 'tts'])
    expect(filterAssets(assets, { ...noFilters, language: 'en' }).map((a) => a.id)).toEqual(['gate'])
    expect(filterAssets(assets, { ...noFilters, source: 'generated' }).map((a) => a.id)).toEqual(['tts'])
  })

  it('searches title and file name case-insensitively', () => {
    expect(filterAssets(assets, { ...noFilters, search: 'ВЫХОД' }).map((a) => a.id)).toEqual(['gate'])
    expect(filterAssets(assets, { ...noFilters, search: 'a12-en' }).map((a) => a.id)).toEqual(['gate'])
  })

  it('lists only the files directly inside the open folder', () => {
    const view = (folderSelection: string) =>
      assetsInView(filterAssets(assets, noFilters), folders, { folder: folderSelection, search: '' }).map(
        (a) => a.id,
      )

    expect(view('dep')).toEqual(['gong'])
    expect(view('su')).toEqual(['gate'])
    expect(view(NO_FOLDER)).toEqual(['tts'])
    // Sorted by title, case-insensitively: «выход» < «Гонг» < «Уважаемые».
    expect(view(ALL_FILES)).toEqual(['gate', 'gong', 'tts'])
  })

  it('treats «Все файлы» and any search as a flat view across folders', () => {
    expect(isFlatView({ folder: ALL_FILES, search: '' })).toBe(true)
    expect(isFlatView({ folder: 'dep', search: 'гонг' })).toBe(true)
    expect(isFlatView({ folder: 'dep', search: '  ' })).toBe(false)
    expect(
      assetsInView(filterAssets(assets, { ...noFilters, search: 'выход' }), folders, {
        folder: 'dep',
        search: 'выход',
      }).map((a) => a.id),
    ).toEqual(['gate'])
  })
})
