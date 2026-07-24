import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getSupplementaryTemplates,
  launchSupplementaryAnnouncement,
} from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'

export type LaunchSupplementaryVariables = {
  templateId: string
  languages: string[]
}

/** Active supplementary announcement presets, loaded only while the modal is open. */
export function useSupplementaryTemplates(enabled: boolean) {
  return useQuery({
    queryKey: dispatcherKeys.supplementaryTemplates,
    queryFn: getSupplementaryTemplates,
    enabled,
  })
}

/**
 * Launch an airport-wide supplementary announcement from a preset (task 024). Like
 * the other queue actions this is eventual: on success we only invalidate the
 * playback queue query, so the new row shows up on the «Статус» screen once polling
 * catches up.
 */
export function useLaunchSupplementaryAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<{ id: string }, Error, LaunchSupplementaryVariables>({
    mutationFn: (input) => launchSupplementaryAnnouncement(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dispatcherKeys.playbackQueue,
      })
    },
  })
}
