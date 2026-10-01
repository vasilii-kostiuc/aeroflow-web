import { Alert, Badge, Group, Loader, Paper, Stack, Table, Text } from '@mantine/core'
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'

import { PageHeader } from '@/shared/ui/PageHeader'

import { useSystemStatus } from '../hooks/useSystemStatus'
import { overallTitles, stateColors, stateLabels } from '../model/labels'

/**
 * «Состояние системы» (task 034): every component of AeroFlow with its status,
 * refreshed every few seconds. Workers are judged by their heartbeat, the audio
 * agent by its subscription in RabbitMQ.
 */
export function SystemStatusScreen() {
  const status = useSystemStatus()
  const data = status.data

  return (
    <Stack gap="lg">
      <PageHeader
        title="Состояние системы"
        description="Работают ли сервисы, через которые проходит объявление: core, брокер сообщений, playback, аудиоагент и синтез речи. Обновляется каждые 10 секунд."
      />

      {status.isPending && <Loader aria-label="Проверка состояния" />}
      {status.isError && (
        <Alert color="danger" icon={<IconAlertTriangle size={18} />}>
          Не удалось получить состояние системы — возможно, недоступен сам core.
        </Alert>
      )}

      {data && (
        <>
          <Alert
            color={stateColors[data.overall]}
            icon={data.overall === 'ok' ? <IconCircleCheck size={18} /> : <IconAlertTriangle size={18} />}
            title={overallTitles[data.overall]}
          >
            Проверено в {new Date(data.checkedAt).toLocaleTimeString('ru-RU')}
            {status.isError ? ' — последнее обновление не удалось, данные могут быть неактуальны.' : '.'}
          </Alert>

          <Paper withBorder p="lg">
            <Table.ScrollContainer minWidth={560}>
              <Table aria-label="Компоненты" verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Компонент</Table.Th>
                    <Table.Th w={150}>Состояние</Table.Th>
                    <Table.Th>Подробности</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.components.map((component) => (
                    <Table.Tr key={component.key}>
                      <Table.Td>
                        <Text fw={500}>{component.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={stateColors[component.status]}>
                          {stateLabels[component.status]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Text size="sm" c={component.status === 'ok' ? 'dimmed' : undefined}>
                            {component.detail}
                          </Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </>
      )}
    </Stack>
  )
}
