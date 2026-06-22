import {
  ActionIcon,
  Badge,
  Group,
  Menu,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import {
  IconDotsVertical,
  IconEdit,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react'

import type { FlightDefinition } from '../model/types'
import { useAirports } from '@/features/airports/hooks/useAirports'
import { formatAirportLabel } from '@/features/airports/model/formatAirportLabel'

type Props = {
  items: FlightDefinition[]
  pendingId: string | null
  onEdit: (flightDefinition: FlightDefinition) => void
  onActivate: (flightDefinition: FlightDefinition) => void
  onDeactivate: (flightDefinition: FlightDefinition) => void
}

const directionLabels = {
  departure: 'Вылет',
  arrival: 'Прибытие',
}

export function FlightDefinitionTable({
  items,
  pendingId,
  onEdit,
  onActivate,
  onDeactivate,
}: Props) {
  const airports = useAirports({ page: 1, limit: 100 })
  const airportByCode = new Map(
    (airports.data?.items ?? []).map((airport) => [airport.code, airport]),
  )

  function airportLabel(code: string) {
    const airport = airportByCode.get(code)
    return airport ? formatAirportLabel(airport) : code
  }

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Рейс</Table.Th>
            <Table.Th>Направление</Table.Th>
            <Table.Th>Маршрут</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th w={60}>
              <span className="visually-hidden">Действия</span>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text fw={700}>{item.flightNumber}</Text>
              </Table.Td>
              <Table.Td>{directionLabels[item.direction]}</Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Text>{airportLabel(item.originAirportCode)}</Text>
                  <Text c="dimmed">→</Text>
                  <Text>{airportLabel(item.destinationAirportCode)}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge color={item.active ? 'green' : 'gray'} variant="light">
                  {item.active ? 'Активна' : 'Неактивна'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <Tooltip label="Действия">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={`Действия для рейса ${item.flightNumber}`}
                        loading={pendingId === item.id}
                      >
                        <IconDotsVertical size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit size={16} />}
                      onClick={() => onEdit(item)}
                    >
                      Редактировать
                    </Menu.Item>
                    {item.active ? (
                      <Menu.Item
                        color="red"
                        leftSection={<IconPlayerPause size={16} />}
                        onClick={() => onDeactivate(item)}
                      >
                        Деактивировать
                      </Menu.Item>
                    ) : (
                      <Menu.Item
                        color="green"
                        leftSection={<IconPlayerPlay size={16} />}
                        onClick={() => onActivate(item)}
                      >
                        Активировать
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
