import { useState } from 'react'

import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconPlus } from '@tabler/icons-react'
import { useSearchParams } from 'react-router'

import {
  useActivateFlightDefinition,
  useDeactivateFlightDefinition,
  useFlightDefinitions,
} from '@/features/flight-definitions/hooks/useFlightDefinitions'
import type {
  FlightDefinition,
  FlightDefinitionFilters,
} from '@/features/flight-definitions/model/types'
import {
  parseFlightDefinitionFilters,
  serializeFlightDefinitionFilters,
} from '@/features/flight-definitions/model/urlFilters'
import { FlightDefinitionFilters as Filters } from '@/features/flight-definitions/ui/FlightDefinitionFilters'
import { FlightDefinitionForm } from '@/features/flight-definitions/ui/FlightDefinitionForm'
import { FlightDefinitionTable } from '@/features/flight-definitions/ui/FlightDefinitionTable'
import { ApiClientError } from '@/shared/api/apiClient'

export function FlightDefinitionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpened, setFormOpened] = useState(false)
  const [editing, setEditing] = useState<FlightDefinition | null>(null)
  const [formTab, setFormTab] = useState<'details' | 'announcements'>('details')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const filters = parseFlightDefinitionFilters(searchParams)
  const definitions = useFlightDefinitions(filters)
  const activateMutation = useActivateFlightDefinition()
  const deactivateMutation = useDeactivateFlightDefinition()

  function updateFilters(changes: Partial<FlightDefinitionFilters>) {
    const next = { ...filters, ...changes }
    setSearchParams(serializeFlightDefinitionFilters(next), { replace: true })
  }

  function openCreate() {
    setEditing(null)
    setFormTab('details')
    setFormOpened(true)
  }

  function openEdit(item: FlightDefinition) {
    setEditing(item)
    setFormTab('details')
    setFormOpened(true)
  }

  function openAnnouncements(item: FlightDefinition) {
    setEditing(item)
    setFormTab('announcements')
    setFormOpened(true)
  }

  async function changeActive(item: FlightDefinition, active: boolean) {
    setPendingId(item.id)
    try {
      if (active) {
        await activateMutation.mutateAsync(item.id)
      } else {
        await deactivateMutation.mutateAsync(item.id)
      }
      notifications.show({
        color: 'green',
        message: active
          ? `Рейс ${item.flightNumber} активирован`
          : `Рейс ${item.flightNumber} деактивирован`,
      })
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        await definitions.refetch()
      }
      notifications.show({
        color: 'red',
        title: 'Не удалось изменить статус',
        message:
          error instanceof Error ? error.message : 'Повторите попытку позже',
      })
    } finally {
      setPendingId(null)
    }
  }

  function confirmDeactivate(item: FlightDefinition) {
    modals.openConfirmModal({
      title: 'Деактивировать карточку?',
      children: (
        <Text size="sm">
          Рейс {item.flightNumber} перестанет быть доступен диспетчеру в
          сценариях запуска объявлений. Карточку можно будет активировать снова.
        </Text>
      ),
      labels: { confirm: 'Деактивировать', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: () => void changeActive(item, false),
    })
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1}>Карточки рейсов</Title>
          <Text c="dimmed" mt={4}>
            Административное управление справочником рейсов.
          </Text>
        </div>

        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
          Добавить карточку
        </Button>
      </Group>

      <Paper withBorder radius="lg" p="lg">
        <Stack>
          <Filters filters={filters} onChange={updateFilters} />

          {definitions.isPending && (
            <Center py="xl">
              <Loader aria-label="Загрузка карточек рейсов" />
            </Center>
          )}

          {definitions.isError && (
            <Alert color="red" title="Не удалось загрузить карточки">
              <Stack gap="sm">
                <Text size="sm">
                  {definitions.error instanceof Error
                    ? definitions.error.message
                    : 'Повторите попытку позже'}
                </Text>
                <Button
                  variant="light"
                  color="red"
                  onClick={() => void definitions.refetch()}
                  w="fit-content"
                >
                  Повторить
                </Button>
              </Stack>
            </Alert>
          )}

          {definitions.data && definitions.data.items.length === 0 && (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <Text fw={600}>Карточки не найдены</Text>
                <Text size="sm" c="dimmed">
                  Измените фильтры или добавьте новую карточку рейса.
                </Text>
              </Stack>
            </Center>
          )}

          {definitions.data && definitions.data.items.length > 0 && (
            <>
              <FlightDefinitionTable
                items={definitions.data.items}
                pendingId={pendingId}
                onEdit={openEdit}
                onConfigureAnnouncements={openAnnouncements}
                onActivate={(item) => void changeActive(item, true)}
                onDeactivate={confirmDeactivate}
              />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Всего: {definitions.data.pagination.totalItems}
                </Text>
                {definitions.data.pagination.totalPages > 1 && (
                  <Pagination
                    value={filters.page}
                    total={definitions.data.pagination.totalPages}
                    onChange={(page) => updateFilters({ page })}
                  />
                )}
              </Group>
            </>
          )}
        </Stack>
      </Paper>

      {formOpened && (
        <FlightDefinitionForm
          opened
          flightDefinition={editing}
          initialTab={formTab}
          onClose={() => setFormOpened(false)}
        />
      )}
    </Stack>
  )
}
