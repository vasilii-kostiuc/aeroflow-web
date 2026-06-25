import { apiRequest } from '@/shared/api/apiClient'

import type { Language } from '../model/types'

export function getLanguages(): Promise<Language[]> {
  return apiRequest('/v1/languages')
}
