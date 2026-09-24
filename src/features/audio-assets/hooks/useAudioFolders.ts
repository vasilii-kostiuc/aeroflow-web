import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { audioAssetKeys } from '../api/audioAssetKeys'
import {
  createAudioFolder,
  deleteAudioFolder,
  getAudioFolders,
  updateAudioFolder,
} from '../api/audioFolderApi'
import type { AudioFolder, AudioFolderInput } from '../model/types'

export function useAudioFolders() {
  return useQuery({
    queryKey: audioAssetKeys.folders(),
    queryFn: getAudioFolders,
  })
}

function useInvalidateFolders() {
  const client = useQueryClient()

  return () => client.invalidateQueries({ queryKey: audioAssetKeys.folders() })
}

export function useCreateAudioFolder() {
  const invalidate = useInvalidateFolders()

  return useMutation({
    mutationFn: createAudioFolder,
    onSuccess: invalidate,
  })
}

export function useUpdateAudioFolder() {
  const invalidate = useInvalidateFolders()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AudioFolderInput }) =>
      updateAudioFolder(id, input),
    onSuccess: invalidate,
  })
}

/** Move a folder under another one (null = top level), updating the tree at once. */
export function useMoveAudioFolder() {
  const client = useQueryClient()
  const key = audioAssetKeys.folders()

  return useMutation({
    mutationFn: ({ folder, parentId }: { folder: AudioFolder; parentId: string | null }) =>
      updateAudioFolder(folder.id, { name: folder.name, parentId }),
    onMutate: async ({ folder, parentId }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<AudioFolder[]>(key)
      client.setQueryData<AudioFolder[]>(key, (current) =>
        current?.map((item) => (item.id === folder.id ? { ...item, parentId } : item)),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(key, context.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}

/** Deleting a folder may move inactive assets to the root, so both lists refresh. */
export function useDeleteAudioFolder() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: deleteAudioFolder,
    onSuccess: () => client.invalidateQueries({ queryKey: audioAssetKeys.all }),
  })
}
