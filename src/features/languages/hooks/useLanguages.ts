import { useQuery } from '@tanstack/react-query'

import { getLanguages } from '../api/languageApi'

export const languageKeys = {
  all: ['languages'] as const,
}

export function useLanguages() {
  return useQuery({
    queryKey: languageKeys.all,
    queryFn: getLanguages,
  })
}
