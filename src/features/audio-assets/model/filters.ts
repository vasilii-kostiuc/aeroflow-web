import { effectiveFolderId } from './folderTree'
import type { AudioAsset, AudioFolder, LibraryFilters } from './types'
import { ALL_FILES, ALL_LANGUAGES, NO_FOLDER } from './types'

const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true })

export function sortByTitle(assets: AudioAsset[]): AudioAsset[] {
  return [...assets].sort(
    (a, b) => collator.compare(a.title, b.title) || collator.compare(a.name, b.name),
  )
}

/**
 * Language, source and search filters — everything except the folder. Their result
 * feeds both the table and the tree counters.
 */
export function filterAssets(
  assets: AudioAsset[],
  filters: Pick<LibraryFilters, 'language' | 'source' | 'search'>,
): AudioAsset[] {
  const query = filters.search.trim().toLocaleLowerCase('ru')

  return assets.filter(
    (asset) =>
      asset.active &&
      (filters.language === ALL_LANGUAGES || asset.languageCode === filters.language) &&
      (filters.source === 'all' || asset.source === filters.source) &&
      (!query ||
        asset.title.toLocaleLowerCase('ru').includes(query) ||
        asset.name.toLocaleLowerCase('ru').includes(query)),
  )
}

/**
 * Assets the table lists for a folder view: directly inside the selected folder.
 * «Все файлы» and any search show the whole (already filtered) library.
 */
export function assetsInView(
  filtered: AudioAsset[],
  folders: AudioFolder[],
  filters: Pick<LibraryFilters, 'folder' | 'search'>,
): AudioAsset[] {
  if (filters.search.trim() || filters.folder === ALL_FILES) return sortByTitle(filtered)

  const folderId = filters.folder === NO_FOLDER ? null : filters.folder

  return sortByTitle(filtered.filter((asset) => effectiveFolderId(asset, folders) === folderId))
}

/** Whether the table is a flat list across folders (shows a folder column). */
export function isFlatView(filters: Pick<LibraryFilters, 'folder' | 'search'>): boolean {
  return Boolean(filters.search.trim()) || filters.folder === ALL_FILES
}
