import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changeSupplementaryTemplateStatus,
  createSupplementaryTemplate,
  getSupplementaryTemplates,
  updateSupplementaryTemplate,
} from '../api/supplementaryTemplateApi'
import type { SupplementaryTemplateInput } from '../model/types'

export const supplementaryTemplateKeys = {
  all: ['supplementary-templates'] as const,
}

export function useSupplementaryTemplates() {
  return useQuery({
    queryKey: supplementaryTemplateKeys.all,
    queryFn: getSupplementaryTemplates,
  })
}

function useInvalidateTemplates() {
  const client = useQueryClient()

  return () => client.invalidateQueries({ queryKey: supplementaryTemplateKeys.all })
}

export function useCreateSupplementaryTemplate() {
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: (input: SupplementaryTemplateInput) =>
      createSupplementaryTemplate(input),
    onSuccess: invalidate,
  })
}

export function useUpdateSupplementaryTemplate() {
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplementaryTemplateInput }) =>
      updateSupplementaryTemplate(id, input),
    onSuccess: invalidate,
  })
}

export function useChangeSupplementaryTemplateStatus() {
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      changeSupplementaryTemplateStatus(id, active),
    onSuccess: invalidate,
  })
}
