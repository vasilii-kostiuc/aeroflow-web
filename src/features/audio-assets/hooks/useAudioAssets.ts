import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import {
  generateAudioAsset,
  getAudioAssets,
  moveAudioAssets,
  updateAudioAsset,
  uploadAudioAsset,
} from '../api/audioAssetApi'
import { audioAssetKeys } from '../api/audioAssetKeys'
import type { AudioAsset, UpdateAudioAssetInput } from '../model/types'

export function useAudioAssets() {
  return useQuery({
    queryKey: audioAssetKeys.assets(),
    queryFn: getAudioAssets,
  })
}

/**
 * Put a freshly created or changed asset into the cached list right away, so a
 * picker can show its title before the refetch lands, then refetch.
 */
function applyAsset(client: QueryClient, asset: AudioAsset) {
  client.setQueryData<AudioAsset[]>(audioAssetKeys.assets(), (current) =>
    current
      ? current.some((item) => item.id === asset.id)
        ? current.map((item) => (item.id === asset.id ? asset : item))
        : [...current, asset]
      : current,
  )

  return client.invalidateQueries({ queryKey: audioAssetKeys.assets() })
}

export function useUploadAudioAsset() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: uploadAudioAsset,
    onSuccess: (asset) => applyAsset(client, asset),
  })
}

export function useUpdateAudioAsset() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAudioAssetInput }) =>
      updateAudioAsset(id, input),
    onSuccess: (asset) => applyAsset(client, asset),
  })
}

/** Generate an audio asset from text (TTS); it becomes pickable immediately. */
export function useGenerateAudioAsset() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: generateAudioAsset,
    onSuccess: (asset) => applyAsset(client, asset),
  })
}

/**
 * Move assets to a folder. The list updates at once (drag and drop must feel
 * instant) and rolls back if the server refuses.
 */
export function useMoveAudioAssets() {
  const client = useQueryClient()
  const key = audioAssetKeys.assets()

  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      moveAudioAssets(ids, folderId),
    onMutate: async ({ ids, folderId }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<AudioAsset[]>(key)
      const moved = new Set(ids)
      client.setQueryData<AudioAsset[]>(key, (current) =>
        current?.map((asset) => (moved.has(asset.id) ? { ...asset, folderId } : asset)),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(key, context.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}
