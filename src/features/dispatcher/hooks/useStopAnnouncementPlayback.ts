import { useMutation, useQueryClient } from '@tanstack/react-query'

import { stopAnnouncementPlayback } from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'

/**
 * Stop the currently sounding announcement from the queue screen. The stop is
 * asynchronous end to end: the row leaves «Сейчас звучит» once the agent confirms
 * the interruption, so on success we only invalidate the query and let polling
 * catch up.
 */
export function useStopAnnouncementPlayback() {
  const queryClient = useQueryClient()

  return useMutation<{ announcementId: string }, Error, string>({
    mutationFn: (announcementId) => stopAnnouncementPlayback(announcementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dispatcherKeys.playbackQueue,
      })
    },
  })
}
