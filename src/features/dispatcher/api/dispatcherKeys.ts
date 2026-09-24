export const dispatcherKeys = {
  all: ['dispatcher'] as const,
  board: [...['dispatcher'], 'board'] as const,
  checkInCounters: [...['dispatcher'], 'check-in-counters'] as const,
  gates: [...['dispatcher'], 'gates'] as const,
  playbackQueue: [...['dispatcher'], 'playback-queue'] as const,
  supplementaryTemplates: [...['dispatcher'], 'supplementary-templates'] as const,
  emergencyTemplates: [...['dispatcher'], 'emergency-templates'] as const,
  emergencyMode: [...['dispatcher'], 'emergency-mode'] as const,
  announcementLanguages: (
    flightDefinitionId: string,
    announcementType: string,
  ) =>
    [
      ...dispatcherKeys.all,
      'announcement-languages',
      flightDefinitionId,
      announcementType,
    ] as const,
}
