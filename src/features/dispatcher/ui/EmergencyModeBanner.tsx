import { Alert, Button, Group, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconAlertTriangle } from '@tabler/icons-react'

import {
  useDeactivateEmergencyMode,
  useEmergencyMode,
} from '../hooks/useEmergencyAnnouncement'

function formatSince(iso: string | null): string {
  if (!iso) return ''

  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Shown while emergency mode holds the queue (task 026). The state comes from
 * playback, not from this browser having launched the announcement, so the banner is
 * also correct for a dispatcher who joined mid-emergency or works at another
 * workstation.
 *
 * Lifting the mode is eventual like Stop and Cancel: the banner clears once playback
 * confirms, not on the click.
 */
export function EmergencyModeBanner() {
  const mode = useEmergencyMode()
  const deactivate = useDeactivateEmergencyMode()

  if (!mode.data?.active) return null

  const confirmDeactivate = () =>
    modals.openConfirmModal({
      title: 'Снять экстренный режим?',
      children: (
        <Text size="sm">
          Обычная очередь объявлений продолжится. Уже запущенные экстренные
          объявления не отменяются.
        </Text>
      ),
      labels: { confirm: 'Деактивировать', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: () => deactivate.mutate(),
    })

  return (
    <Alert
      color="red"
      variant="filled"
      icon={<IconAlertTriangle size={18} />}
      title="Экстренный режим активен"
    >
      <Group justify="space-between" align="center" wrap="wrap">
        <Text size="sm">
          Обычная очередь приостановлена
          {mode.data.since ? ` с ${formatSince(mode.data.since)}` : ''}.
        </Text>
        <Button
          size="compact-sm"
          variant="white"
          color="red"
          loading={deactivate.isPending}
          onClick={confirmDeactivate}
        >
          Деактивировать экстренный режим
        </Button>
      </Group>
    </Alert>
  )
}
