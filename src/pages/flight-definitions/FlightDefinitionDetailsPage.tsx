import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { paths } from '@/app/router/paths'
import { useAirports } from '@/features/airports/hooks/useAirports'
import { formatAirportLabel } from '@/features/airports/model/formatAirportLabel'
import {
  useFlightDefinition,
  useUpdateFlightDefinition,
} from '@/features/flight-definitions/hooks/useFlightDefinitions'
import type {
  FlightDefinition,
  FlightDefinitionInput,
} from '@/features/flight-definitions/model/types'
import { FlightAnnouncementConfigsPanel } from '@/features/flight-definitions/ui/announcement-configs/FlightAnnouncementConfigsPanel'
import { FlightDefinitionDetailsForm } from '@/features/flight-definitions/ui/FlightDefinitionDetailsForm'

type TabValue = 'details' | 'announcements'

const directionLabels = {
  departure: 'Вылет',
  arrival: 'Прибытие',
}

export function FlightDefinitionDetailsPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const flight = useFlightDefinition(id)
  const updateMutation = useUpdateFlightDefinition()
  const tab = parseTab(searchParams.get('tab'))

  function updateTab(value: string | null) {
    const next = parseTab(value)
    setSearchParams(next === 'details' ? {} : { tab: next }, { replace: true })
  }

  async function updateFlightDefinition(input: FlightDefinitionInput) {
    if (!id) return
    const updated = await updateMutation.mutateAsync({ id, input })
    notifications.show({
      color: 'green',
      message: `Карточка ${updated.flightNumber} сохранена`,
    })
  }

  if (flight.isPending) {
    return (
      <Center py="xl">
        <Loader aria-label="Загрузка карточки рейса" />
      </Center>
    )
  }

  if (flight.isError || !flight.data) {
    return (
      <Stack gap="lg">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate(paths.flightDefinitions)}
          w="fit-content"
        >
          К списку
        </Button>
        <Alert color="red" title="Не удалось загрузить карточку">
          <Stack gap="sm">
            <Text size="sm">
              {flight.error instanceof Error
                ? flight.error.message
                : 'Карточка не найдена или временно недоступна.'}
            </Text>
            <Button
              variant="light"
              color="red"
              onClick={() => void flight.refetch()}
              w="fit-content"
            >
              Повторить
            </Button>
          </Stack>
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <FlightDefinitionHeader flightDefinition={flight.data} />

      <Tabs value={tab} onChange={updateTab}>
        <Tabs.List>
          <Tabs.Tab value="details">Карточка</Tabs.Tab>
          <Tabs.Tab value="announcements">Объявления</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Paper withBorder p="lg">
            <FlightDefinitionDetailsForm
              flightDefinition={flight.data}
              submitLabel="Сохранить"
              submitting={updateMutation.isPending}
              onCancel={() => navigate(paths.flightDefinitions)}
              onSubmit={updateFlightDefinition}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="announcements" pt="md">
          <FlightAnnouncementConfigsPanel flightDefinition={flight.data} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

function FlightDefinitionHeader({
  flightDefinition,
}: {
  flightDefinition: FlightDefinition
}) {
  const navigate = useNavigate()
  const airports = useAirports({ page: 1, limit: 100 })
  const airportByCode = new Map(
    (airports.data?.items ?? []).map((airport) => [airport.code, airport]),
  )
  const origin = airportByCode.get(flightDefinition.originAirportCode)
  const destination = airportByCode.get(flightDefinition.destinationAirportCode)

  return (
    <Group justify="space-between" align="flex-start">
      <Stack gap={4}>
        <Group gap="xs">
          <Title order={1}>{flightDefinition.flightNumber}</Title>
          <Badge color={flightDefinition.active ? 'green' : 'gray'} variant="light">
            {flightDefinition.active ? 'Активна' : 'Неактивна'}
          </Badge>
        </Group>
        <Text c="dimmed">
          {directionLabels[flightDefinition.direction]} ·{' '}
          {origin ? formatAirportLabel(origin) : flightDefinition.originAirportCode}
          {' → '}
          {destination
            ? formatAirportLabel(destination)
            : flightDefinition.destinationAirportCode}
        </Text>
      </Stack>
      <Button
        variant="default"
        leftSection={<IconArrowLeft size={18} />}
        onClick={() => navigate(paths.flightDefinitions)}
      >
        К списку
      </Button>
    </Group>
  )
}

function parseTab(value: string | null): TabValue {
  return value === 'announcements' ? 'announcements' : 'details'
}
