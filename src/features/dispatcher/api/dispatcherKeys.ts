export const dispatcherKeys = {
  all: ['dispatcher'] as const,
  occurrences: (operationalDate: string) =>
    [...dispatcherKeys.all, 'occurrences', operationalDate] as const,
  checkInCounters: [...['dispatcher'], 'check-in-counters'] as const,
  gates: [...['dispatcher'], 'gates'] as const,
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
