import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addAnnouncementVariant,
  activateFlightDefinition,
  createFlightAnnouncementConfig,
  createFlightDefinition,
  deleteAnnouncementVariant,
  deactivateFlightDefinition,
  getFlightAnnouncementConfigs,
  getAudioAssets,
  updateAnnouncementVariant,
  updateFlightAnnouncementConfig,
  uploadAudioAsset,
  getFlightDefinitions,
  updateFlightDefinition,
} from '../api/flightDefinitionApi'
import { flightDefinitionKeys } from '../api/flightDefinitionKeys'
import type {
  AnnouncementVariantInput,
  FlightAnnouncementConfigInput,
  FlightAnnouncementConfigSettingsInput,
  FlightDefinitionFilters,
  FlightDefinitionInput,
} from '../model/types'

export function useFlightDefinitions(filters: FlightDefinitionFilters) {
  return useQuery({
    queryKey: flightDefinitionKeys.list(filters),
    queryFn: () => getFlightDefinitions(filters),
  })
}

function useInvalidateFlightDefinitions() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({ queryKey: flightDefinitionKeys.all })
}

export function useCreateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: createFlightDefinition,
    onSuccess: invalidate,
  })
}

export function useUpdateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: FlightDefinitionInput
    }) => updateFlightDefinition(id, input),
    onSuccess: invalidate,
  })
}

export function useActivateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: activateFlightDefinition,
    onSuccess: invalidate,
  })
}

export function useDeactivateFlightDefinition() {
  const invalidate = useInvalidateFlightDefinitions()
  return useMutation({
    mutationFn: deactivateFlightDefinition,
    onSuccess: invalidate,
  })
}

export function useFlightAnnouncementConfigs(flightDefinitionId?: string) {
  return useQuery({
    queryKey: flightDefinitionId
      ? flightDefinitionKeys.announcementConfigs(flightDefinitionId)
      : flightDefinitionKeys.announcementConfigs(''),
    queryFn: () => getFlightAnnouncementConfigs(flightDefinitionId ?? ''),
    enabled: Boolean(flightDefinitionId),
  })
}

export function useAudioAssets() {
  return useQuery({
    queryKey: flightDefinitionKeys.audioAssets,
    queryFn: getAudioAssets,
  })
}

export function useUploadAudioAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      languageCode,
    }: {
      file: File
      languageCode: string
    }) => uploadAudioAsset(file, languageCode),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: flightDefinitionKeys.audioAssets,
      }),
  })
}

function useInvalidateAnnouncementConfigs(flightDefinitionId: string) {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({
      queryKey: flightDefinitionKeys.announcementConfigs(flightDefinitionId),
    })
}

export function useCreateFlightAnnouncementConfig(flightDefinitionId: string) {
  const invalidate = useInvalidateAnnouncementConfigs(flightDefinitionId)
  return useMutation({
    mutationFn: (input: FlightAnnouncementConfigInput) =>
      createFlightAnnouncementConfig(flightDefinitionId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateFlightAnnouncementConfig(flightDefinitionId: string) {
  const invalidate = useInvalidateAnnouncementConfigs(flightDefinitionId)
  return useMutation({
    mutationFn: ({
      configId,
      input,
    }: {
      configId: string
      input: FlightAnnouncementConfigSettingsInput
    }) => updateFlightAnnouncementConfig(flightDefinitionId, configId, input),
    onSuccess: invalidate,
  })
}

export function useAddAnnouncementVariant(flightDefinitionId: string) {
  const invalidate = useInvalidateAnnouncementConfigs(flightDefinitionId)
  return useMutation({
    mutationFn: ({
      configId,
      input,
    }: {
      configId: string
      input: AnnouncementVariantInput
    }) => addAnnouncementVariant(flightDefinitionId, configId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateAnnouncementVariant(flightDefinitionId: string) {
  const invalidate = useInvalidateAnnouncementConfigs(flightDefinitionId)
  return useMutation({
    mutationFn: ({
      configId,
      variantId,
      input,
    }: {
      configId: string
      variantId: string
      input: AnnouncementVariantInput
    }) => updateAnnouncementVariant(flightDefinitionId, configId, variantId, input),
    onSuccess: invalidate,
  })
}

export function useDeleteAnnouncementVariant(flightDefinitionId: string) {
  const invalidate = useInvalidateAnnouncementConfigs(flightDefinitionId)
  return useMutation({
    mutationFn: ({
      configId,
      variantId,
    }: {
      configId: string
      variantId: string
    }) => deleteAnnouncementVariant(flightDefinitionId, configId, variantId),
    onSuccess: invalidate,
  })
}
