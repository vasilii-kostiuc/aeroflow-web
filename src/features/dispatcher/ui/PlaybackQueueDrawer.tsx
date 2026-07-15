import {
  Alert,
  Badge,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import { actionLabels } from '../model/labels'
import type { PlaybackQueueRow } from '../model/types'
import { usePlaybackQueue } from '../hooks/usePlaybackQueue'

const stateColors: Record<PlaybackQueueRow['state'], string> = {
  playing: 'green',
  waiting: 'blue',
  completed: 'gray',
  failed: 'red',
}

const stateLabels: Record<PlaybackQueueRow['state'], string> = {
  playing: 'Звучит',
  waiting: 'В очереди',
  completed: 'Завершено',
  failed: 'Ошибка',
}

function formatTime(iso: string | null): string {
  if (!iso) return ''

  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function QueueRow({ row }: { row: PlaybackQueueRow }) {
  const parameters = [
    row.checkInCounters.length > 0
      ? `стойки ${row.checkInCounters.map((counter) => counter.code).join(', ')}`
      : null,
    row.gate ? `выход ${row.gate.code}` : null,
  ].filter(Boolean)

  return (
    <Group justify="space-between" wrap="nowrap" py={6}>
      <div>
        <Group gap="xs">
          <Text fw={600}>{row.flightNumber ?? '—'}</Text>
          <Text size="sm">{actionLabels[row.announcementType]}</Text>
          <Badge size="sm" variant="light" color={stateColors[row.state]}>
            {stateLabels[row.state]}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {[parameters.join(', '), row.languages.join(', ')]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {row.failureReason ? (
          <Text size="xs" c="red">
            {row.failureReason}
          </Text>
        ) : null}
      </div>
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {formatTime(row.finishedAt ?? row.startedAt ?? row.queuedAt)}
      </Text>
    </Group>
  )
}

function Section({
  title,
  rows,
  emptyMessage,
}: {
  title: string
  rows: PlaybackQueueRow[]
  emptyMessage: string
}) {
  return (
    <div>
      <Divider label={title} labelPosition="left" mb={4} />
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      ) : (
        rows.map((row) => <QueueRow key={row.jobId} row={row} />)
      )}
    </div>
  )
}

/**
 * Heir of the legacy Status window: what is playing, what waits, what just
 * finished. Read-only in this slice — cancelling a pending row and stopping the
 * current sound are the follow-up slices of the same epic.
 */
export function PlaybackQueueDrawer({
  opened,
  onClose,
}: {
  opened: boolean
  onClose: () => void
}) {
  const queue = usePlaybackQueue(opened)

  return (
    <Drawer opened={opened} onClose={onClose} title="Статус очереди" position="right">
      {queue.isError ? (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
          Не удалось обновить очередь — данные могут быть неактуальны.
        </Alert>
      ) : null}

      {queue.isLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : queue.data ? (
        <Stack gap="md">
          <Section
            title="Сейчас звучит"
            rows={queue.data.playing ? [queue.data.playing] : []}
            emptyMessage="Тишина — очередь свободна"
          />
          <Section
            title="В очереди"
            rows={queue.data.waiting}
            emptyMessage="Нет ожидающих объявлений"
          />
          <Section
            title="Недавние"
            rows={queue.data.recent}
            emptyMessage="Сегодня ещё ничего не звучало"
          />
        </Stack>
      ) : null}
    </Drawer>
  )
}
