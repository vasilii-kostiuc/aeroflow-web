import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changeEmergencyTemplateStatus,
  createEmergencyTemplate,
  getEmergencyTemplates,
  updateEmergencyTemplate,
} from '../api/emergencyTemplateApi'
import type { EmergencyTemplateInput } from '../model/types'

export const emergencyTemplateKeys = {
  all: ['emergency-templates'] as const,
}

export function useEmergencyTemplates() {
  return useQuery({
    queryKey: emergencyTemplateKeys.all,
    queryFn: getEmergencyTemplates,
  })
}

function useInvalidateTemplates() {
  const client = useQueryClient()

  return () => client.invalidateQueries({ queryKey: emergencyTemplateKeys.all })
}

export function useCreateEmergencyTemplate() {
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: (input: EmergencyTemplateInput) => createEmergencyTemplate(input),
    onSuccess: invalidate,
  })
}

export function useUpdateEmergencyTemplate() {
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmergencyTemplateInput }) =>
      updateEmergencyTemplate(id, input),
    onSuccess: invalidate,
  })
}

export function useChangeEmergencyTemplateStatus() {
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      changeEmergencyTemplateStatus(id, active),
    onSuccess: invalidate,
  })
}
