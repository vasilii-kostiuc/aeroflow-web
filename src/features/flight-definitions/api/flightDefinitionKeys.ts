import type { FlightDefinitionFilters } from '../model/types'

export const flightDefinitionKeys = {
  all: ['flight-definitions'] as const,
  lists: () => [...flightDefinitionKeys.all, 'list'] as const,
  list: (filters: FlightDefinitionFilters) =>
    [...flightDefinitionKeys.lists(), filters] as const,
  details: () => [...flightDefinitionKeys.all, 'detail'] as const,
  detail: (id: string) => [...flightDefinitionKeys.details(), id] as const,
  announcementConfigs: (id: string) =>
    [...flightDefinitionKeys.detail(id), 'announcement-configs'] as const,
  audioAssets: ['audio-assets'] as const,
}
