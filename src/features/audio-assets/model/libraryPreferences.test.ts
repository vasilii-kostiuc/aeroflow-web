import { beforeEach, describe, expect, it } from 'vitest'

import { RECENT_LIMIT, selectUserPreferences, useLibraryPreferences } from './libraryPreferences'
import { NO_FOLDER } from './types'

const prefs = (userId: string) => selectUserPreferences(userId)(useLibraryPreferences.getState())

describe('libraryPreferences', () => {
  beforeEach(() => useLibraryPreferences.setState({ byUser: {} }))

  it('keeps recent picks newest first, without duplicates and capped', () => {
    const { rememberPick } = useLibraryPreferences.getState()
    for (let index = 0; index < RECENT_LIMIT + 2; index += 1) {
      rememberPick('u1', 'preset:emergency', `a${index}`, NO_FOLDER)
    }
    rememberPick('u1', 'preset:emergency', 'a5', 'folder-1')

    const { recent, lastFolderByPlace } = prefs('u1')
    expect(recent).toHaveLength(RECENT_LIMIT)
    expect(recent[0]).toBe('a5')
    expect(recent.filter((id) => id === 'a5')).toHaveLength(1)
    expect(lastFolderByPlace['preset:emergency']).toBe('folder-1')
  })

  it('separates users and places', () => {
    const { rememberPick } = useLibraryPreferences.getState()
    rememberPick('u1', 'segment:arrival', 'a', 'arr')
    rememberPick('u2', 'segment:boarding_invitation', 'b', 'dep')

    expect(prefs('u1')).toEqual({ recent: ['a'], lastFolderByPlace: { 'segment:arrival': 'arr' } })
    expect(prefs('u2').recent).toEqual(['b'])
    expect(prefs('nobody')).toEqual({ recent: [], lastFolderByPlace: {} })
  })

  it('prunes recent ids that are no longer active', () => {
    const { rememberPick, pruneRecent } = useLibraryPreferences.getState()
    rememberPick('u1', 'p', 'keep', NO_FOLDER)
    rememberPick('u1', 'p', 'gone', NO_FOLDER)

    pruneRecent('u1', new Set(['keep']))

    expect(prefs('u1').recent).toEqual(['keep'])
  })

  it('persists to localStorage', () => {
    useLibraryPreferences.getState().rememberPick('u1', 'p', 'a', NO_FOLDER)

    expect(localStorage.getItem('aeroflow.audio-library')).toContain('"recent":["a"]')
  })
})
