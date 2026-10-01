export const paths = {
  home: '/',
  login: '/login',
  flightDefinitions: '/flight-definitions',
  flightDefinitionNew: '/flight-definitions/new',
  flightDefinitionDetails: '/flight-definitions/:id',
  flightDefinitionDetailsPath: (id: string, tab: 'details' | 'announcements' = 'details') =>
    `/flight-definitions/${id}?tab=${tab}`,
  airports: '/airports',
  supplementaryTemplates: '/supplementary-announcements',
  emergencyTemplates: '/emergency-announcements',
  audioAssets: '/audio-assets',
  users: '/users',
  systemStatus: '/system-status',
  dispatcher: '/dispatcher',
} as const
