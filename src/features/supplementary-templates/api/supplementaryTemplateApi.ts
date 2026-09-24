import { apiRequest } from '@/shared/api/apiClient'

import type {
  SupplementaryTemplate,
  SupplementaryTemplateInput,
} from '../model/types'

const basePath = '/v1/admin/supplementary-announcement-templates'

export function getSupplementaryTemplates(): Promise<SupplementaryTemplate[]> {
  return apiRequest(basePath)
}

export function createSupplementaryTemplate(
  input: SupplementaryTemplateInput,
): Promise<SupplementaryTemplate> {
  return apiRequest(basePath, { method: 'POST', body: input })
}

export function updateSupplementaryTemplate(
  id: string,
  input: SupplementaryTemplateInput,
): Promise<SupplementaryTemplate> {
  return apiRequest(`${basePath}/${id}`, { method: 'PATCH', body: input })
}

export function changeSupplementaryTemplateStatus(
  id: string,
  active: boolean,
): Promise<SupplementaryTemplate> {
  return apiRequest(`${basePath}/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
    body: {},
  })
}
