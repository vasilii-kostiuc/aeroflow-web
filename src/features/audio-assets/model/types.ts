export type AudioAssetSource = 'uploaded' | 'generated'

/** An audio file of the library (Audio Catalog). `name` is the technical file name. */
export type AudioAsset = {
  id: string
  /** Human-readable title shown everywhere in the UI (task 031). */
  title: string
  name: string
  languageCode: string
  /** Library folder; null = «Без папки». */
  folderId: string | null
  source: AudioAssetSource
  active: boolean
  mimeType?: string | null
  sizeBytes?: number | null
}

/** A library folder; the tree is assembled on the client from `parentId`. */
export type AudioFolder = {
  id: string
  name: string
  parentId: string | null
}

export const ALL_FILES = 'all'
export const NO_FOLDER = 'root'

/** What the library browser shows: the whole library, the root, or one folder id. */
export type FolderSelection = typeof ALL_FILES | typeof NO_FOLDER | string

export const ALL_LANGUAGES = 'all'

export type SourceFilter = 'all' | AudioAssetSource

export type LibraryFilters = {
  folder: FolderSelection
  /** A language code, or {@link ALL_LANGUAGES}. */
  language: string
  source: SourceFilter
  search: string
}

export type UploadAudioAssetInput = {
  file: File
  languageCode: string
  title?: string
  folderId?: string | null
}

export type UpdateAudioAssetInput = {
  title: string
  folderId: string | null
}

export type AudioFolderInput = {
  name: string
  parentId: string | null
}
