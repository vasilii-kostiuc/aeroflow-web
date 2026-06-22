import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconDotsVertical, IconEdit, IconPlus } from '@tabler/icons-react'

import { useAirports, useChangeAirportStatus } from '@/features/airports/hooks/useAirports'
import type { Airport } from '@/features/airports/model/types'
import { AirportForm } from '@/features/airports/ui/AirportForm'

export function AirportsPage() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState<boolean | undefined>()
  const [editing, setEditing] = useState<Airport | null | undefined>()
  const airports = useAirports({ search: search || undefined, active, page: 1, limit: 100 })
  const status = useChangeAirportStatus()

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Аэропорты</Title>
          <Text c="dimmed">Административный справочник аэропортов и городов.</Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setEditing(null)}>Добавить аэропорт</Button>
      </Group>

      <Paper withBorder radius="lg" p="lg">
        <Stack>
          <Group grow align="flex-end">
            <TextInput label="Поиск" placeholder="Код, город или аэропорт" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
            <Select
              label="Статус"
              placeholder="Все"
              clearable
              data={[{ value: 'true', label: 'Активные' }, { value: 'false', label: 'Неактивные' }]}
              value={active === undefined ? null : String(active)}
              onChange={(value) => setActive(value === null ? undefined : value === 'true')}
            />
          </Group>

          {airports.isPending && <Loader aria-label="Загрузка аэропортов" />}
          {airports.isError && <Alert color="red">Не удалось загрузить справочник аэропортов.</Alert>}
          {airports.data?.items.length === 0 && <Text c="dimmed">Аэропорты не найдены.</Text>}
          {airports.data && airports.data.items.length > 0 && (
            <Table.ScrollContainer minWidth={700}>
              <Table highlightOnHover>
                <Table.Thead><Table.Tr><Table.Th>Код</Table.Th><Table.Th>Город</Table.Th><Table.Th>Аэропорт</Table.Th><Table.Th>Страна</Table.Th><Table.Th>Статус</Table.Th><Table.Th /></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {airports.data.items.map((airport) => (
                    <Table.Tr key={airport.id}>
                      <Table.Td><Text fw={700}>{airport.code}</Text></Table.Td>
                      <Table.Td>{airport.cityName}</Table.Td>
                      <Table.Td>{airport.name}</Table.Td>
                      <Table.Td>{airport.countryCode}</Table.Td>
                      <Table.Td><Badge color={airport.active ? 'green' : 'gray'}>{airport.active ? 'Активен' : 'Неактивен'}</Badge></Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end">
                          <Menu.Target><ActionIcon variant="subtle" aria-label={`Действия для ${airport.code}`}><IconDotsVertical size={18} /></ActionIcon></Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => setEditing(airport)}>Редактировать</Menu.Item>
                            <Menu.Item
                              color={airport.active ? 'red' : 'green'}
                              onClick={() => status.mutate({ id: airport.id, active: !airport.active })}
                            >
                              {airport.active ? 'Деактивировать' : 'Активировать'}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Paper>
      {editing !== undefined && <AirportForm airport={editing} onClose={() => setEditing(undefined)} />}
    </Stack>
  )
}

