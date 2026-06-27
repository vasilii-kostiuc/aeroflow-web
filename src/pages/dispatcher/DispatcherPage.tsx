import { useMemo, useState } from 'react'

import {
  Alert,
  Center,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import { useAirports } from '@/features/airports/hooks/useAirports'
import { formatAirportLabel } from '@/features/airports/model/formatAirportLabel'
import {
  filterEligibleFlights,
  filterStartNextFlights,
} from '@/features/dispatcher/model/board'
import type {
  BoardFlight,
  DispatcherFilterType,
} from '@/features/dispatcher/model/types'
import { useDispatcherBoard } from '@/features/dispatcher/hooks/useDispatcherBoard'
import { DispatcherActionFilter } from '@/features/dispatcher/ui/DispatcherActionFilter'
import { DispatcherFlightList } from '@/features/dispatcher/ui/DispatcherFlightList'
import { DispatcherLaunchPanel } from '@/features/dispatcher/ui/DispatcherLaunchPanel'
import { DispatcherStartNextPanel } from '@/features/dispatcher/ui/DispatcherStartNextPanel'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DispatcherPage() {
  const [operationalDate, setOperationalDate] = useState(today)
  const [action, setAction] = useState<DispatcherFilterType>('check_in_opening')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const board = useDispatcherBoard(operationalDate)
  const airportsQuery = useAirports({ page: 1, limit: 100 })

  const eligibleFlights = useMemo(
    () =>
      action === 'start_next_run'
        ? filterStartNextFlights(board.flights)
        : filterEligibleFlights(action, board.flights),
    [action, board.flights],
  )

  // Derive the selected flight from the eligible list: a selection that is no
  // longer eligible (status advanced, action switched) simply resolves to null.
  const selectedFlight: BoardFlight | null =
    eligibleFlights.find((flight) => flight.flightDefinitionId === selectedId) ??
    null

  const resolveAirportLabel = useMemo(() => {
    const byCode = new Map(
      (airportsQuery.data?.items ?? []).map((airport) => [
        airport.code,
        airport,
      ]),
    )

    return (code: string) => {
      const airport = byCode.get(code)
      return airport ? formatAirportLabel(airport) : code
    }
  }, [airportsQuery.data])

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <div>
          <Title order={2}>Панель диспетчера</Title>
          <Text c="dimmed" size="sm">
            Запуск рейсовых объявлений по активным рейсам
          </Text>
        </div>
        <TextInput
          type="date"
          label="Операционная дата"
          value={operationalDate}
          onChange={(event) => setOperationalDate(event.currentTarget.value)}
        />
      </Group>

      <DispatcherActionFilter value={action} onChange={setAction} />

      {board.isError ? (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          Не удалось загрузить рейсы. Повторите попытку позже.
        </Alert>
      ) : board.isLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : board.flights.length === 0 ? (
        <Text c="dimmed" py="xl" ta="center">
          Нет активных карточек рейсов
        </Text>
      ) : (
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <DispatcherFlightList
              flights={eligibleFlights}
              selectedId={selectedFlight?.flightDefinitionId ?? null}
              onSelect={(flight) => setSelectedId(flight.flightDefinitionId)}
              resolveAirportLabel={resolveAirportLabel}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            {action === 'start_next_run' ? (
              <DispatcherStartNextPanel
                key={`${selectedFlight?.flightDefinitionId ?? 'none'}:start_next`}
                flight={selectedFlight}
                operationalDate={operationalDate}
                resolveAirportLabel={resolveAirportLabel}
              />
            ) : (
              <DispatcherLaunchPanel
                key={`${selectedFlight?.flightDefinitionId ?? 'none'}:${action}`}
                flight={selectedFlight}
                action={action}
                operationalDate={operationalDate}
                resolveAirportLabel={resolveAirportLabel}
              />
            )}
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  )
}
