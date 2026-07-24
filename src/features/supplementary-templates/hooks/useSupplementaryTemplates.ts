import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changeSupplementaryTemplateStatus,
  createSupplementaryTemplate,
  generateAudioAsset,
  getAudioAssets,
  getSupplementaryTemplates,
  updateSupplementaryTemplate,
} from '../api/supplementaryTemplateApi'
import type { SupplementaryTemplateInput } from '../model/types'

export const supplementaryTemplateKeys = {
  all: ['supplementary-templates'] as const,
  audioAssets: ['supplementary-templates', 'audio-assets'] as const,
}

export function useSupplementaryTemplates() {
  return useQuery({
    queryKey: supplementaryTemplateKeys.all,
    queryFn: getSupplementaryTemplates,
  })
}

export function useAudioAssets() {
  return useQuery({
    queryKey: supplementaryTemplateKeys.audioAssets,
    queryFn: getAudioAssets,
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

/** Generate an audio asset from text; refresh the assets list so it becomes pickable. */
export function useGenerateAudioAsset() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: { text: string; languageCode: string }) =>
      generateAudioAsset(input),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: supplementaryTemplateKeys.audioAssets,
      }),
  })
}
