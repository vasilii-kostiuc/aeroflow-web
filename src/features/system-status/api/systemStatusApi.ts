import { apiRequest } from '@/shared/api/apiClient'

import type { SystemAlert, SystemStatus } from '../model/types'

export const systemStatusKeys = {
  all: ['system-status'] as const,
  status: () => [...systemStatusKeys.all, 'status'] as const,
  alerts: () => [...systemStatusKeys.all, 'alerts'] as const,
}

/** Administrators: every component with its status. */
export function getSystemStatus(): Promise<SystemStatus> {
  return apiRequest('/v1/admin/system-status')
}

/** Dispatchers: only what keeps announcements from sounding; empty when all is well. */
export function getSystemAlerts(): Promise<SystemAlert[]> {
  return apiRequest('/v1/dispatcher/system-alerts')
}
