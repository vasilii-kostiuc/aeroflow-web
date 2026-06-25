import { apiRequest } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/api/types'

import type {
  AnnouncementVariantInput,
  AudioAsset,
  FlightDefinition,
  FlightAnnouncementConfig,
  FlightAnnouncementConfigInput,
  FlightAnnouncementConfigSettingsInput,
  FlightDefinitionFilters,
  FlightDefinitionInput,
} from '../model/types'

const basePath = '/v1/flight-definitions'

export function buildFlightDefinitionQuery(
  filters: FlightDefinitionFilters,
): string {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.direction) params.set('direction', filters.direction)
  if (filters.active !== undefined) {
    params.set('active', String(filters.active))
  }

  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))

  return params.toString()
}

export function getFlightDefinitions(
  filters: FlightDefinitionFilters,
): Promise<PaginatedResult<FlightDefinition>> {
  return apiRequest(`${basePath}?${buildFlightDefinitionQuery(filters)}`)
}

export function getFlightDefinition(id: string): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}`)
}

export function createFlightDefinition(
  input: FlightDefinitionInput,
): Promise<FlightDefinition> {
  return apiRequest(basePath, { method: 'POST', body: input })
}

export function updateFlightDefinition(
  id: string,
  input: FlightDefinitionInput,
): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}`, { method: 'PUT', body: input })
}

export function activateFlightDefinition(
  id: string,
): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}/activate`, {
    method: 'POST',
    body: {},
  })
}

export function deactivateFlightDefinition(
  id: string,
): Promise<FlightDefinition> {
  return apiRequest(`${basePath}/${id}/deactivate`, {
    method: 'POST',
    body: {},
  })
}

const adminBasePath = '/v1/admin/flight-definitions'

function announcementConfigPath(flightDefinitionId: string): string {
  return `${adminBasePath}/${flightDefinitionId}/announcement-configs`
}

export function getFlightAnnouncementConfigs(
  flightDefinitionId: string,
): Promise<FlightAnnouncementConfig[]> {
  return apiRequest(announcementConfigPath(flightDefinitionId))
}

export function createFlightAnnouncementConfig(
  flightDefinitionId: string,
  input: FlightAnnouncementConfigInput,
): Promise<FlightAnnouncementConfig> {
  return apiRequest(announcementConfigPath(flightDefinitionId), {
    method: 'POST',
    body: input,
  })
}

export function updateFlightAnnouncementConfig(
  flightDefinitionId: string,
  configId: string,
  input: FlightAnnouncementConfigSettingsInput,
): Promise<FlightAnnouncementConfig> {
  return apiRequest(`${announcementConfigPath(flightDefinitionId)}/${configId}`, {
    method: 'PATCH',
    body: input,
  })
}

export function addAnnouncementVariant(
  flightDefinitionId: string,
  configId: string,
  input: AnnouncementVariantInput,
): Promise<FlightAnnouncementConfig> {
  return apiRequest(
    `${announcementConfigPath(flightDefinitionId)}/${configId}/variants`,
    {
      method: 'POST',
      body: input,
    },
  )
}

export function updateAnnouncementVariant(
  flightDefinitionId: string,
  configId: string,
  variantId: string,
  input: AnnouncementVariantInput,
): Promise<FlightAnnouncementConfig> {
  return apiRequest(
    `${announcementConfigPath(flightDefinitionId)}/${configId}/variants/${variantId}`,
    {
      method: 'PATCH',
      body: input,
    },
  )
}

export function deleteAnnouncementVariant(
  flightDefinitionId: string,
  configId: string,
  variantId: string,
): Promise<FlightAnnouncementConfig> {
  return apiRequest(
    `${announcementConfigPath(flightDefinitionId)}/${configId}/variants/${variantId}`,
    {
      method: 'DELETE',
    },
  )
}

export function getAudioAssets(): Promise<AudioAsset[]> {
  return apiRequest('/v1/admin/audio-assets')
}

export function uploadAudioAsset(
  file: File,
  languageCode: string,
): Promise<AudioAsset> {
  const body = new FormData()
  body.set('file', file)
  body.set('languageCode', languageCode)

  return apiRequest('/v1/admin/audio-assets', {
    method: 'POST',
    body,
  })
}
