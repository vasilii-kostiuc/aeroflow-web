import { apiRequest } from '@/shared/api/apiClient'

import type { AudioFolder, AudioFolderInput } from '../model/types'

/** Every folder as a flat list; the tree is built on the client. */
export function getAudioFolders(): Promise<AudioFolder[]> {
  return apiRequest('/v1/admin/audio-folders')
}

/** 409 = the name is taken under this parent; 422 = invalid name or too deep. */
export function createAudioFolder(input: AudioFolderInput): Promise<AudioFolder> {
  return apiRequest('/v1/admin/audio-folders', {
    method: 'POST',
    body: input,
  })
}

/** Rename and/or move; 422 also covers moving a folder into itself or a subfolder. */
export function updateAudioFolder(
  id: string,
  input: AudioFolderInput,
): Promise<AudioFolder> {
  return apiRequest(`/v1/admin/audio-folders/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

/** Only an empty folder can be deleted; 409 otherwise. */
export function deleteAudioFolder(id: string): Promise<void> {
  return apiRequest(`/v1/admin/audio-folders/${id}`, {
    method: 'DELETE',
  })
}
