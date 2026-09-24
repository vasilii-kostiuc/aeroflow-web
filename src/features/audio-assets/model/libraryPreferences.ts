import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { FolderSelection } from './types'

export const RECENT_LIMIT = 8

type UserPreferences = {
  /** Most recently picked asset ids, newest first. */
  recent: string[]
  /** Folder last picked from, per place of choice (e.g. `segment:boarding_invitation`). */
  lastFolderByPlace: Record<string, FolderSelection>
}

type LibraryPreferencesState = {
  byUser: Record<string, UserPreferences>
  rememberPick: (
    userId: string,
    placeKey: string,
    assetId: string,
    folder: FolderSelection,
  ) => void
  /** Drop recent ids that are no longer active assets. */
  pruneRecent: (userId: string, validIds: Set<string>) => void
}

const empty: UserPreferences = { recent: [], lastFolderByPlace: {} }

/**
 * Per-user conveniences of the audio library picker (task 031): recently picked
 * assets and the folder last used for each place of choice. They are preferences,
 * not server data, so they live in the browser, keyed by user, and survive logout.
 */
export const useLibraryPreferences = create<LibraryPreferencesState>()(
  persist(
    (set) => ({
      byUser: {},
      rememberPick: (userId, placeKey, assetId, folder) =>
        set((state) => {
          const current = state.byUser[userId] ?? empty

          return {
            byUser: {
              ...state.byUser,
              [userId]: {
                recent: [assetId, ...current.recent.filter((id) => id !== assetId)].slice(
                  0,
                  RECENT_LIMIT,
                ),
                lastFolderByPlace: { ...current.lastFolderByPlace, [placeKey]: folder },
              },
            },
          }
        }),
      pruneRecent: (userId, validIds) =>
        set((state) => {
          const current = state.byUser[userId]
          if (!current) return state
          const recent = current.recent.filter((id) => validIds.has(id))
          if (recent.length === current.recent.length) return state

          return { byUser: { ...state.byUser, [userId]: { ...current, recent } } }
        }),
    }),
    {
      name: 'aeroflow.audio-library',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ byUser: state.byUser }),
    },
  ),
)

export function selectUserPreferences(userId: string) {
  return (state: LibraryPreferencesState): UserPreferences => state.byUser[userId] ?? empty
}
