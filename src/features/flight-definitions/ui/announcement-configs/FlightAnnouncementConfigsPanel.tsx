import { useState } from 'react'

import { Alert, Badge, Button, Group, Paper, Stack, Tabs, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconPlus } from '@tabler/icons-react'

import { ApiClientError } from '@/shared/api/apiClient'
import {
  confirmDiscardChanges,
  useUnsavedChangesGuard,
} from '@/shared/lib/useUnsavedChangesGuard'

import {
  useCreateFlightAnnouncementConfig,
  useFlightAnnouncementConfigs,
} from '../../hooks/useFlightDefinitions'
import { availableTypes, typeLabels } from '../../model/announcementConfig'
import type {
  FlightAnnouncementConfig,
  FlightAnnouncementType,
  FlightDefinition,
} from '../../model/types'
import { AnnouncementConfigCard } from './AnnouncementConfigCard'

type Props = {
  flightDefinition: FlightDefinition
}

function TabStatus({ config }: { config?: FlightAnnouncementConfig }) {
  if (!config) return <Badge size="xs" color="gray" variant="light">не создано</Badge>
  if (!config.enabled) return <Badge size="xs" color="gray" variant="light">выключено</Badge>

  return config.isValidForDispatcher ? (
    <Badge size="xs" color="teal" variant="light">готово</Badge>
  ) : (
    <Badge size="xs" color="yellow" variant="light">настроить</Badge>
  )
}

/**
 * What a flight announces and in which languages, one tab per announcement type.
 * Unsaved edits are never dropped silently: switching tabs, navigating away and
 * closing the browser tab all ask first (task 028).
 */
export function FlightAnnouncementConfigsPanel({ flightDefinition }: Props) {
  const configsQuery = useFlightAnnouncementConfigs(flightDefinition.id)
  const createMutation = useCreateFlightAnnouncementConfig(flightDefinition.id)
  const types = availableTypes(flightDefinition.direction)
  const [activeType, setActiveType] = useState<FlightAnnouncementType>(types[0])
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const configByType = new Map(
    (configsQuery.data ?? []).map((config) => [config.announcementType, config]),
  )

  useUnsavedChangesGuard(dirty)

  function switchTab(type: FlightAnnouncementType) {
    if (type === activeType) return

    if (dirty) {
      confirmDiscardChanges(() => {
        setDirty(false)
        setActiveType(type)
      })
    } else {
      setActiveType(type)
    }
  }

  async function createConfig(type: FlightAnnouncementType) {
    setError(null)
    try {
      await createMutation.mutateAsync({
        announcementType: type,
        enabled: true,
        repeatEveryMinutes: type === 'check_in_continuation' ? 6 : null,
      })
    } catch (mutationError) {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'Не удалось создать настройку объявления.',
      )
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={4}>Объявления рейса</Title>
        <Text c="dimmed" size="sm">
          Что и на каких языках звучит, когда диспетчер выполняет действие по рейсу.
        </Text>
      </Stack>

      {error ? (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      ) : null}

      {configsQuery.isLoading ? (
        <Text c="dimmed" size="sm">
          Загружаю объявления...
        </Text>
      ) : (
        <Tabs
          value={activeType}
          keepMounted={false}
          onChange={(value) => {
            if (value) switchTab(value as FlightAnnouncementType)
          }}
        >
          <Tabs.List>
            {types.map((type) => (
              <Tabs.Tab key={type} value={type}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm">{typeLabels[type]}</Text>
                  <TabStatus config={configByType.get(type)} />
                </Group>
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {types.map((type) => {
            const config = configByType.get(type)

            return (
              <Tabs.Panel key={type} value={type} pt="md">
                {config ? (
                  <AnnouncementConfigCard
                    key={config.id}
                    config={config}
                    flightDefinitionId={flightDefinition.id}
                    onDirtyChange={setDirty}
                  />
                ) : (
                  <Paper withBorder p="lg">
                    <Stack gap="sm">
                      <Text c="dimmed" size="sm">
                        Объявление «{typeLabels[type]}» для этого рейса ещё не настроено.
                      </Text>
                      <Button
                        w="fit-content"
                        leftSection={<IconPlus size={16} />}
                        loading={createMutation.isPending}
                        onClick={() => void createConfig(type)}
                      >
                        Настроить
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Tabs.Panel>
            )
          })}
        </Tabs>
      )}
    </Stack>
  )
}
