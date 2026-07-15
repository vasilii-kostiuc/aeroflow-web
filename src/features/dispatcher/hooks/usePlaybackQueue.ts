import { useQuery } from '@tanstack/react-query'

import { getPlaybackQueue } from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'

const POLL_INTERVAL_MS = 3000

/**
 * Playback queue read model. Polls only while the Status drawer is open —
 * realtime transport is a separate future decision (web architecture.md).
 */
export function usePlaybackQueue(enabled: boolean) {
  return useQuery({
    queryKey: dispatcherKeys.playbackQueue,
    queryFn: getPlaybackQueue,
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
  })
}
