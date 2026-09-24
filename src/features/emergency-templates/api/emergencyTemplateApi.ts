import { apiRequest } from '@/shared/api/apiClient'

import type { EmergencyTemplate, EmergencyTemplateInput } from '../model/types'

const basePath = '/v1/admin/emergency-announcement-templates'

export function getEmergencyTemplates(): Promise<EmergencyTemplate[]> {
  return apiRequest(basePath)
}

export function createEmergencyTemplate(
  input: EmergencyTemplateInput,
): Promise<EmergencyTemplate> {
  return apiRequest(basePath, { method: 'POST', body: input })
}

export function updateEmergencyTemplate(
  id: string,
  input: EmergencyTemplateInput,
): Promise<EmergencyTemplate> {
  return apiRequest(`${basePath}/${id}`, { method: 'PATCH', body: input })
}

export function changeEmergencyTemplateStatus(
  id: string,
  active: boolean,
): Promise<EmergencyTemplate> {
  return apiRequest(`${basePath}/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
    body: {},
  })
}
