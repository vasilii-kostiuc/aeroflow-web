import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { generateAudioAsset, getAudioAssets } from '../api/audioAssetApi'

export const audioAssetKeys = {
  all: ['announcement-presets', 'audio-assets'] as const,
}

/** Audio assets a preset variant can point at — shared by every preset catalog. */
export function useAudioAssets() {
  return useQuery({
    queryKey: audioAssetKeys.all,
    queryFn: getAudioAssets,
  })
}

/** Generate an audio asset from text; refresh the assets list so it becomes pickable. */
export function useGenerateAudioAsset() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: { text: string; languageCode: string }) =>
      generateAudioAsset(input),
    onSuccess: () => client.invalidateQueries({ queryKey: audioAssetKeys.all }),
  })
}
