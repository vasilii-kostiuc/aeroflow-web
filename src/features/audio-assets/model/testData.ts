import type { AudioAsset, AudioFolder } from './types'

export const folder = (id: string, name: string, parentId: string | null = null): AudioFolder => ({
  id,
  name,
  parentId,
})

export const asset = (
  id: string,
  title: string,
  overrides: Partial<AudioAsset> = {},
): AudioAsset => ({
  id,
  title,
  name: `${id}.wav`,
  languageCode: 'ru',
  folderId: null,
  source: 'uploaded',
  active: true,
  ...overrides,
})
