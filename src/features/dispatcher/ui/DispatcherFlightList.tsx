import { useMemo, useState } from 'react'

import { Badge, Card, Group, Stack, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

import { matchesSearch } from '../model/board'
import { boardStatusLabel, isBoardStarted } from '../model/labels'
import type { BoardFlight } from '../model/types'

type Props = {
  flights: BoardFlight[]
  selectedId: string | null
  onSelect: (flight: BoardFlight) => void
  resolveAirportLabel: (code: string) => string
}

function routeCode(flight: BoardFlight): string {
  return flight.direction === 'arrival'
    ? flight.originAirportCode
    : flight.destinationAirportCode
}

export function DispatcherFlightList({
  flights,
  selectedId,
  onSelect,
  resolveAirportLabel,
}: Props) {
  const [search, setSearch] = useState('')

  const visible = useMemo(
    () => flights.filter((flight) => matchesSearch(flight, search)),
    [flights, search],
  )

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Поиск по номеру рейса или коду аэропорта"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

      {visible.length === 0 ? (
        <Text c="dimmed" size="sm" py="md" ta="center">
          Нет подходящих рейсов для выбранного действия
        </Text>
      ) : (
        visible.map((flight) => (
          <Card
            key={flight.flightDefinitionId}
            withBorder
            padding="sm"
            onClick={() => onSelect(flight)}
            style={{ cursor: 'pointer' }}
            bg={
              flight.flightDefinitionId === selectedId
                ? 'var(--mantine-color-blue-light)'
                : undefined
            }
          >
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text fw={600}>{flight.flightNumber}</Text>
                <Text size="sm" c="dimmed">
                  {flight.direction === 'arrival' ? 'Прибытие · ' : 'Вылет · '}
                  {resolveAirportLabel(routeCode(flight))}
                </Text>
              </div>
              <Badge
                variant="light"
                color={isBoardStarted(flight.status) ? 'blue' : 'gray'}
              >
                {boardStatusLabel(flight.status)}
              </Badge>
            </Group>
          </Card>
        ))
      )}
    </Stack>
  )
}
