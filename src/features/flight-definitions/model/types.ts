export type FlightDirection = 'departure' | 'arrival'

export type FlightDefinition = {
  id: string
  flightNumber: string
  direction: FlightDirection
  originAirportCode: string
  destinationAirportCode: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type FlightDefinitionInput = Pick<
  FlightDefinition,
  | 'flightNumber'
  | 'direction'
  | 'originAirportCode'
  | 'destinationAirportCode'
>

export type FlightDefinitionFilters = {
  search?: string
  direction?: FlightDirection
  active?: boolean
  page: number
  limit: number
}

export type FlightAnnouncementType =
  | 'check_in_opening'
  | 'check_in_continuation'
  | 'check_in_closing'
  | 'boarding_invitation'
  | 'arrival'

export type AnnouncementVariantSourceType = 'audio_asset' | 'text'

export type AnnouncementVariant = {
  id: string
  languageCode: string
  sortOrder: number
  sourceType: AnnouncementVariantSourceType
  audioAssetId: string | null
  text: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type FlightAnnouncementConfig = {
  id: string
  flightDefinitionId: string
  announcementType: FlightAnnouncementType
  enabled: boolean
  repeatEveryMinutes: number | null
  isValidForDispatcher: boolean
  validationErrors: string[]
  variants: AnnouncementVariant[]
  createdAt: string
  updatedAt: string
}

export type AudioAsset = {
  id: string
  name: string
  languageCode: string
  active: boolean
  mimeType: string | null
  sizeBytes: number | null
}

export type FlightAnnouncementConfigInput = {
  announcementType: FlightAnnouncementType
  enabled: boolean
  repeatEveryMinutes?: number | null
}

export type FlightAnnouncementConfigSettingsInput = {
  enabled: boolean
  repeatEveryMinutes?: number | null
}

export type AnnouncementVariantInput = {
  languageCode: string
  sortOrder: number
  sourceType: AnnouncementVariantSourceType
  audioAssetId?: string | null
  text?: string | null
  enabled: boolean
}
