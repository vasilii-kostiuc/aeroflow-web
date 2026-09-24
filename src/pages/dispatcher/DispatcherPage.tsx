import { useMemo, useState } from 'react'

import {
  Alert,
  Button,
  Center,
  Grid,
  Loader,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconPlaylist,
  IconSpeakerphone,
} from '@tabler/icons-react'

import { useAirports } from '@/features/airports/hooks/useAirports'
import { formatAirportLabel } from '@/features/airports/model/formatAirportLabel'
import { filterEligibleFlights } from '@/features/dispatcher/model/board'
import type {
  BoardFlight,
  DispatcherActionType,
} from '@/features/dispatcher/model/types'
import { useDispatcherBoard } from '@/features/dispatcher/hooks/useDispatcherBoard'
import { DispatcherActionFilter } from '@/features/dispatcher/ui/DispatcherActionFilter'
import { DispatcherFlightList } from '@/features/dispatcher/ui/DispatcherFlightList'
import { DispatcherLaunchPanel } from '@/features/dispatcher/ui/DispatcherLaunchPanel'
import { EmergencyAnnouncementModal } from '@/features/dispatcher/ui/EmergencyAnnouncementModal'
import { EmergencyModeBanner } from '@/features/dispatcher/ui/EmergencyModeBanner'
import { PlaybackQueueDrawer } from '@/features/dispatcher/ui/PlaybackQueueDrawer'
import { SupplementaryAnnouncementModal } from '@/features/dispatcher/ui/SupplementaryAnnouncementModal'
import { PageHeader } from '@/shared/ui/PageHeader'

export function DispatcherPage() {
  const [action, setAction] = useState<DispatcherActionType>('check_in_opening')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusOpened, setStatusOpened] = useState(false)
  const [supplementaryOpened, setSupplementaryOpened] = useState(false)
  const [emergencyOpened, setEmergencyOpened] = useState(false)

  const board = useDispatcherBoard()
  const airportsQuery = useAirports({ page: 1, limit: 100 })

  const eligibleFlights = useMemo(
    () => filterEligibleFlights(action, board.flights),
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
      <PageHeader
        title="Панель диспетчера"
        description="Запуск рейсовых и аэропортовых объявлений"
        actions={
          <>
            <Button
              variant="default"
              leftSection={<IconSpeakerphone size={16} />}
              onClick={() => setSupplementaryOpened(true)}
            >
              Дополнительное объявление
            </Button>
            <Button
              color="danger"
              leftSection={<IconAlertTriangle size={16} />}
              onClick={() => setEmergencyOpened(true)}
            >
              Экстренное объявление
            </Button>
            <Button
              variant="default"
              leftSection={<IconPlaylist size={16} />}
              onClick={() => setStatusOpened(true)}
            >
              Статус
            </Button>
          </>
        }
      />

      <EmergencyModeBanner />

      <DispatcherActionFilter value={action} onChange={setAction} />

      {board.isError ? (
        <Alert color="danger" icon={<IconAlertCircle size={16} />}>
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
              operationalDate={board.operationalDate}
              selectedId={selectedFlight?.flightDefinitionId ?? null}
              onSelect={(flight) => setSelectedId(flight.flightDefinitionId)}
              resolveAirportLabel={resolveAirportLabel}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <DispatcherLaunchPanel
              key={`${selectedFlight?.flightDefinitionId ?? 'none'}:${action}`}
              flight={selectedFlight}
              action={action}
              resolveAirportLabel={resolveAirportLabel}
            />
          </Grid.Col>
        </Grid>
      )}
      <SupplementaryAnnouncementModal
        opened={supplementaryOpened}
        onClose={() => setSupplementaryOpened(false)}
      />
      <EmergencyAnnouncementModal
        opened={emergencyOpened}
        onClose={() => setEmergencyOpened(false)}
      />
      <PlaybackQueueDrawer
        opened={statusOpened}
        onClose={() => setStatusOpened(false)}
      />
    </Stack>
  )
}
