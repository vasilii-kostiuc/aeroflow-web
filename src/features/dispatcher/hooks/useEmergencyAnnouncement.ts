import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deactivateEmergencyMode,
  getEmergencyMode,
  getEmergencyTemplates,
  launchEmergencyAnnouncement,
} from '../api/dispatcherApi'
import { dispatcherKeys } from '../api/dispatcherKeys'

const MODE_POLL_INTERVAL_MS = 5000

export type LaunchEmergencyVariables = {
  templateId: string
  languages: string[]
}

/** Active emergency presets, loaded only while the launch modal is open. */
export function useEmergencyTemplates(enabled: boolean) {
  return useQuery({
    queryKey: dispatcherKeys.emergencyTemplates,
    queryFn: getEmergencyTemplates,
    enabled,
  })
}

/**
 * Emergency mode as playback reports it. Polled while the dispatcher panel is open
 * because the mode can also be switched on from another workstation — the banner
 * must not depend on this browser having been the one that launched it.
 */
export function useEmergencyMode() {
  return useQuery({
    queryKey: dispatcherKeys.emergencyMode,
    queryFn: getEmergencyMode,
    refetchInterval: MODE_POLL_INTERVAL_MS,
  })
}

/**
 * Launch an emergency announcement from a preset (task 026). Eventual like every
 * other queue action: on success we invalidate the queue and the mode, and the
 * banner appears once playback confirms the mode took effect.
 */
export function useLaunchEmergencyAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<{ id: string }, Error, LaunchEmergencyVariables>({
    mutationFn: (input) => launchEmergencyAnnouncement(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dispatcherKeys.playbackQueue })
      void queryClient.invalidateQueries({ queryKey: dispatcherKeys.emergencyMode })
    },
  })
}

/** Lift emergency mode; the banner clears once playback confirms. */
export function useDeactivateEmergencyMode() {
  const queryClient = useQueryClient()

  return useMutation<{ requested: boolean }, Error, void>({
    mutationFn: () => deactivateEmergencyMode(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dispatcherKeys.emergencyMode })
      void queryClient.invalidateQueries({ queryKey: dispatcherKeys.playbackQueue })
    },
  })
}
