import { useQuery } from '@tanstack/react-query'

import { getSystemAlerts, getSystemStatus, systemStatusKeys } from '../api/systemStatusApi'

export const STATUS_REFRESH_MS = 10_000
export const ALERTS_REFRESH_MS = 15_000

export function useSystemStatus() {
  return useQuery({
    queryKey: systemStatusKeys.status(),
    queryFn: getSystemStatus,
    refetchInterval: STATUS_REFRESH_MS,
  })
}

export function useSystemAlerts() {
  return useQuery({
    queryKey: systemStatusKeys.alerts(),
    queryFn: getSystemAlerts,
    refetchInterval: ALERTS_REFRESH_MS,
  })
}
