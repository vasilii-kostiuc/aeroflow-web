import { apiRequest } from '@/shared/api/apiClient'

import type {
  AudioAsset,
  SupplementaryTemplate,
  SupplementaryTemplateInput,
} from '../model/types'

const basePath = '/v1/admin/supplementary-announcement-templates'

export function getSupplementaryTemplates(): Promise<SupplementaryTemplate[]> {
  return apiRequest(basePath)
}

export function createSupplementaryTemplate(
  input: SupplementaryTemplateInput,
): Promise<SupplementaryTemplate> {
  return apiRequest(basePath, { method: 'POST', body: input })
}

export function updateSupplementaryTemplate(
  id: string,
  input: SupplementaryTemplateInput,
): Promise<SupplementaryTemplate> {
  return apiRequest(`${basePath}/${id}`, { method: 'PATCH', body: input })
}

export function changeSupplementaryTemplateStatus(
  id: string,
  active: boolean,
): Promise<SupplementaryTemplate> {
  return apiRequest(`${basePath}/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
    body: {},
  })
}

/** Active audio assets for picking a preset's per-language audio. */
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
