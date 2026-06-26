import { useMemo, useState } from 'react'

import { Alert, Button, Card, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'

import {
  actionLabels,
  actionRequiresCounters,
  actionRequiresGate,
} from '../model/labels'
import type {
  BoardFlight,
  DispatcherActionType,
  OperationalResource,
} from '../model/types'
import {
  useActiveCheckInCounters,
  useActiveGates,
  useFlightAnnouncementLanguages,
} from '../hooks/useReferenceData'
import { useLaunchAnnouncement } from '../hooks/useLaunchAnnouncement'
import { OperationalResourceButtonPicker } from './OperationalResourceButtonPicker'

type Props = {
  flight: BoardFlight | null
  action: DispatcherActionType
  operationalDate: string
  resolveAirportLabel: (code: string) => string
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const violations = error.violations
      ? Object.values(error.violations).flat()
      : []

    return violations.length > 0 ? violations.join('. ') : error.message
  }

  return 'Не удалось запустить объявление. Повторите попытку.'
}

export function DispatcherLaunchPanel({
  flight,
  action,
  operationalDate,
  resolveAirportLabel,
}: Props) {
  const languagesQuery = useLanguages()
  const configuredLanguagesQuery = useFlightAnnouncementLanguages(
    flight?.flightDefinitionId ?? '',
    action,
  )
  const countersQuery = useActiveCheckInCounters()
  const gatesQuery = useActiveGates()
  const launch = useLaunchAnnouncement()

  // `null` means "use the default selection" (all configured languages); once the
  // dispatcher edits the field we keep their explicit choice. The panel is
  // remounted via key when flight/action changes, so this resets cleanly.
  const [languageOverride, setLanguageOverride] = useState<string[] | null>(null)
  const [counterIds, setCounterIds] = useState<string[]>([])
  const [gateId, setGateId] = useState<string | null>(null)

  const languageNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const language of languagesQuery.data ?? []) {
      names.set(language.code, language.name)
    }

    return names
  }, [languagesQuery.data])

  // Languages come from the flight's announcement config for the chosen action;
  // they are pre-selected by default and the dispatcher may deselect some.
  const configuredLanguages = configuredLanguagesQuery.data?.languages ?? []
  const languageResources: OperationalResource[] = configuredLanguages.map(
    (code, index) => ({
      id: code,
      code: code.toUpperCase(),
      displayName: languageNames.get(code) ?? code,
      sortOrder: index,
      active: true,
    }),
  )

  const languages = languageOverride ?? configuredLanguages

  if (!flight) {
    return (
      <Card withBorder padding="lg">
        <Text c="dimmed">Выберите рейс из списка слева</Text>
      </Card>
    )
  }

  const needsCounters = actionRequiresCounters(action)
  const needsGate = actionRequiresGate(action)
  const routeCode =
    flight.direction === 'arrival'
      ? flight.originAirportCode
      : flight.destinationAirportCode

  const canLaunch =
    languages.length > 0 &&
    (!needsCounters || counterIds.length > 0) &&
    (!needsGate || gateId !== null)

  const handleLaunch = () => {
    launch.mutate({
      flight,
      action,
      operationalDate,
      payload: {
        languages,
        checkInCounterIds: needsCounters ? counterIds : [],
        gateId: needsGate ? gateId : null,
      },
    })
  }

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <div>
          <Title order={4}>{flight.flightNumber}</Title>
          <Text size="sm" c="dimmed">
            {flight.direction === 'arrival' ? 'Прибытие · ' : 'Вылет · '}
            {resolveAirportLabel(routeCode)}
          </Text>
          <Text size="sm" fw={500} mt={4}>
            {actionLabels[action]}
          </Text>
        </div>

        <OperationalResourceButtonPicker
          emptyMessage="Для этого объявления не настроены языки. Настройте конфигурацию рейса."
          label="Языки объявления"
          loading={configuredLanguagesQuery.isLoading}
          multiple
          onChange={setLanguageOverride}
          required
          resources={languageResources}
          value={languages}
        />

        {needsCounters && (
          <OperationalResourceButtonPicker
            emptyMessage="Нет активных стоек регистрации"
            label="Стойки регистрации"
            loading={countersQuery.isLoading}
            multiple
            onChange={setCounterIds}
            resources={countersQuery.data ?? []}
            required
            value={counterIds}
          />
        )}

        {needsGate && (
          <OperationalResourceButtonPicker
            emptyMessage="Нет активных выходов на посадку"
            label="Выход на посадку"
            loading={gatesQuery.isLoading}
            onChange={(next) => setGateId(next[0] ?? null)}
            resources={gatesQuery.data ?? []}
            required
            value={gateId ? [gateId] : []}
          />
        )}

        {launch.isError && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            title="Объявление не запущено"
          >
            {errorMessage(launch.error)}
          </Alert>
        )}

        {launch.isSuccess && (
          <Alert
            color="green"
            icon={<IconCircleCheck size={16} />}
            title="Объявление создано"
          >
            ID объявления: {launch.data.announcementId}
          </Alert>
        )}

        <Button
          onClick={handleLaunch}
          loading={launch.isPending}
          disabled={!canLaunch}
        >
          Запустить объявление
        </Button>
      </Stack>
    </Card>
  )
}
