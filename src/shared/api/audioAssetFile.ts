import { apiRequestBlob } from '@/shared/api/apiClient'

/**
 * Fetch an audio asset's file and return an object URL for in-browser playback.
 * The caller is responsible for revoking the URL when done.
 */
export async function fetchAudioAssetObjectUrl(
  audioAssetId: string,
): Promise<string> {
  const blob = await apiRequestBlob(`/v1/admin/audio-assets/${audioAssetId}/file`)

  return URL.createObjectURL(blob)
}
