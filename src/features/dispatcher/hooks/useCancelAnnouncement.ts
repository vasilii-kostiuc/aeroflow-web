import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cancelAnnouncement } from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'

/**
 * Cancel a waiting announcement from the queue screen. The queue read model is
 * eventual: the row leaves «В очереди» once playback confirms the cancellation,
 * so on success we only invalidate the query and let polling catch up.
 */
export function useCancelAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<{ id: string }, Error, string>({
    mutationFn: (announcementId) => cancelAnnouncement(announcementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dispatcherKeys.playbackQueue,
      })
    },
  })
}
