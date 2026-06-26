export const paths = {
  home: '/',
  login: '/login',
  flightDefinitions: '/flight-definitions',
  flightDefinitionNew: '/flight-definitions/new',
  flightDefinitionDetails: '/flight-definitions/:id',
  flightDefinitionDetailsPath: (id: string, tab: 'details' | 'announcements' = 'details') =>
    `/flight-definitions/${id}?tab=${tab}`,
  airports: '/airports',
  dispatcher: '/dispatcher',
} as const
