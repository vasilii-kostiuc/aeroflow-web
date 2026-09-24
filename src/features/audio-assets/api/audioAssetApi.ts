import { apiRequest } from '@/shared/api/apiClient'

import type {
  AudioAsset,
  UpdateAudioAssetInput,
  UploadAudioAssetInput,
} from '../model/types'

/** Active assets of the library, ordered by title. */
export function getAudioAssets(): Promise<AudioAsset[]> {
  return apiRequest('/v1/admin/audio-assets')
}

/** WAV, MP3 or OGG up to 50 MB. Title defaults to the file name on the server. */
export function uploadAudioAsset(input: UploadAudioAssetInput): Promise<AudioAsset> {
  const body = new FormData()
  body.set('file', input.file)
  body.set('languageCode', input.languageCode)
  if (input.title?.trim()) body.set('title', input.title.trim())
  if (input.folderId) body.set('folderId', input.folderId)

  return apiRequest('/v1/admin/audio-assets', {
    method: 'POST',
    body,
  })
}

/** Rename an asset and/or move it to another folder (null = «Без папки»). */
export function updateAudioAsset(
  id: string,
  input: UpdateAudioAssetInput,
): Promise<AudioAsset> {
  return apiRequest(`/v1/admin/audio-assets/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

/** Move several assets into one folder (null = «Без папки»), all or nothing. */
export function moveAudioAssets(
  assetIds: string[],
  folderId: string | null,
): Promise<AudioAsset[]> {
  return apiRequest('/v1/admin/audio-assets:move', {
    method: 'POST',
    body: { assetIds, folderId },
  })
}

/**
 * Generate (or reuse from cache) an audio asset from text via TTS (task 021). The
 * server caches by hash(text+language+voice), so re-generating identical text is
 * cheap. 422 = empty text / unsupported language; 502 = TTS service unavailable.
 */
export function generateAudioAsset(input: {
  text: string
  languageCode: string
}): Promise<AudioAsset> {
  return apiRequest('/v1/admin/audio-assets:generate', {
    method: 'POST',
    body: input,
  })
}
