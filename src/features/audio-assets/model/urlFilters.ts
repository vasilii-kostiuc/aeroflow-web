import { ALL_FILES, ALL_LANGUAGES, type LibraryFilters, type SourceFilter } from './types'

const sources: SourceFilter[] = ['all', 'uploaded', 'generated']

/** The library screen keeps its open folder and filters in the URL, so a view can be shared. */
export function parseLibraryFilters(params: URLSearchParams): LibraryFilters {
  const source = params.get('source') as SourceFilter | null

  return {
    folder: params.get('folder') || ALL_FILES,
    language: params.get('language') || ALL_LANGUAGES,
    source: source && sources.includes(source) ? source : 'all',
    search: params.get('q') ?? '',
  }
}

/** Defaults are left out, so the plain screen has a plain URL. */
export function writeLibraryFilters(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.folder !== ALL_FILES) params.set('folder', filters.folder)
  if (filters.language !== ALL_LANGUAGES) params.set('language', filters.language)
  if (filters.source !== 'all') params.set('source', filters.source)
  if (filters.search) params.set('q', filters.search)

  return params
}
