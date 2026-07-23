import {
  Alert,
  Badge,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconAlertCircle } from '@tabler/icons-react'

import { announcementTypeLabels } from '../model/labels'
import type { PlaybackQueueRow } from '../model/types'
import { useCancelAnnouncement } from '../hooks/useCancelAnnouncement'
import { useStopAnnouncementPlayback } from '../hooks/useStopAnnouncementPlayback'
import { usePlaybackQueue } from '../hooks/usePlaybackQueue'

const stateColors: Record<PlaybackQueueRow['state'], string> = {
  playing: 'green',
  waiting: 'blue',
  rescheduled: 'blue',
  completed: 'gray',
  failed: 'red',
  cancelled: 'gray',
  interrupted: 'orange',
}

const stateLabels: Record<PlaybackQueueRow['state'], string> = {
  playing: 'Звучит',
  waiting: 'В очереди',
  rescheduled: 'Ждёт повтора',
  completed: 'Завершено',
  failed: 'Ошибка',
  cancelled: 'Отменено',
  interrupted: 'Прервано',
}

function formatTime(iso: string | null): string {
  if (!iso) return ''

  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function QueueRow({
  row,
  onCancel,
  onStop,
  cancelling,
}: {
  row: PlaybackQueueRow
  onCancel?: (row: PlaybackQueueRow) => void
  onStop?: (row: PlaybackQueueRow) => void
  cancelling?: boolean
}) {
  const parameters = [
    row.checkInCounters.length > 0
      ? `стойки ${row.checkInCounters.map((counter) => counter.code).join(', ')}`
      : null,
    row.gate ? `выход ${row.gate.code}` : null,
  ].filter(Boolean)

  // A repeat series resting between ticks sounds nothing and is ended by closing
  // check-in, so neither "Стоп" nor "Убрать" applies to it.
  const resting = row.state === 'rescheduled'

  return (
    <Group justify="space-between" wrap="nowrap" py={6}>
      <div>
        <Group gap="xs">
          <Text fw={600}>{row.flightNumber ?? '—'}</Text>
          <Text size="sm">{announcementTypeLabels[row.announcementType]}</Text>
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
        {resting && row.nextAt ? (
          <Text size="xs" c="dimmed">
            Следующий повтор в {formatTime(row.nextAt)}
          </Text>
        ) : null}
      </div>
      <Group gap="xs" wrap="nowrap">
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {formatTime(
            resting
              ? row.nextAt
              : (row.finishedAt ?? row.startedAt ?? row.queuedAt),
          )}
        </Text>
        {onCancel && !resting ? (
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            loading={cancelling}
            onClick={() => onCancel(row)}
          >
            Убрать
          </Button>
        ) : null}
        {onStop && !resting ? (
          <Button size="compact-xs" variant="subtle" color="red" loading={cancelling} onClick={() => onStop(row)}>
            Стоп
          </Button>
        ) : null}
      </Group>
    </Group>
  )
}

function Section({
  title,
  rows,
  emptyMessage,
  onCancel,
  onStop,
  cancellingId,
}: {
  title: string
  rows: PlaybackQueueRow[]
  emptyMessage: string
  onCancel?: (row: PlaybackQueueRow) => void
  onStop?: (row: PlaybackQueueRow) => void
  cancellingId?: string | null
}) {
  return (
    <div>
      <Divider label={title} labelPosition="left" mb={4} />
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      ) : (
        rows.map((row) => (
          <QueueRow
            key={row.jobId}
            row={row}
            onCancel={onCancel}
            onStop={onStop}
            cancelling={cancellingId === row.announcementId}
          />
        ))
      )}
    </div>
  )
}

/**
 * Heir of the legacy Status window: what is playing, what waits, what just
 * finished. A waiting row can be removed from the queue (task 018) — that cancels
 * only the announcement, never the flight — and the playing row can be stopped
 * (task 019). A repeat series waiting for its next tick (task 023) sits among the
 * waiting rows with the time it sounds again, and offers neither action.
 */
export function PlaybackQueueDrawer({
  opened,
  onClose,
}: {
  opened: boolean
  onClose: () => void
}) {
  const queue = usePlaybackQueue(opened)
  const cancelMutation = useCancelAnnouncement()
  const stopMutation = useStopAnnouncementPlayback()

  function confirmCancel(row: PlaybackQueueRow) {
    modals.openConfirmModal({
      title: 'Убрать объявление из очереди?',
      children: (
        <Text size="sm">
          {row.flightNumber ?? '—'} · {announcementTypeLabels[row.announcementType]} не
          прозвучит. Рейс это не отменяет.
        </Text>
      ),
      labels: { confirm: 'Убрать', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: () => cancelMutation.mutate(row.announcementId),
    })
  }

  function confirmStop(row: PlaybackQueueRow) {
    modals.openConfirmModal({
      title: 'Остановить текущее объявление?',
      children: <Text size="sm">Звучащее объявление будет прервано. Рейс и объявление не отменяются.</Text>,
      labels: { confirm: 'Стоп', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: () => stopMutation.mutate(row.announcementId),
    })
  }

  return (
    <Drawer opened={opened} onClose={onClose} title="Статус очереди" position="right">
      {queue.isError ? (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
          Не удалось обновить очередь — данные могут быть неактуальны.
        </Alert>
      ) : null}
      {cancelMutation.isError ? (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          Не удалось убрать объявление — повторите попытку.
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
            onStop={confirmStop}
            cancellingId={stopMutation.isPending ? stopMutation.variables : null}
          />
          <Section
            title="В очереди"
            rows={queue.data.waiting}
            emptyMessage="Нет ожидающих объявлений"
            onCancel={confirmCancel}
            cancellingId={
              cancelMutation.isPending ? cancelMutation.variables : null
            }
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
