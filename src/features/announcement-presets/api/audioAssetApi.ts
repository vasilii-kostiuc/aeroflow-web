import { apiRequest } from '@/shared/api/apiClient'

import type { AudioAsset } from '../model/types'

/** Audio assets available to voice a preset variant (Audio Catalog admin API). */
export function getAudioAssets(): Promise<AudioAsset[]> {
  return apiRequest('/v1/admin/audio-assets')
}

/**
 * Generate (or reuse from cache) an audio asset from text via TTS (task 021), so a
 * preset variant can be voiced on the spot instead of picking an uploaded file. The
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
