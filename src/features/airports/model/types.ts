export type Airport = {
  id: string
  code: string
  name: string
  cityName: string
  countryCode: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type AirportCreateInput = Pick<
  Airport,
  'code' | 'name' | 'cityName' | 'countryCode'
>

export type AirportUpdateInput = Omit<AirportCreateInput, 'code'>

export type AirportFilters = {
  search?: string
  active?: boolean
  page: number
  limit: number
}

