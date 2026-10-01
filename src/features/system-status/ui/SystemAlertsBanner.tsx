import { Alert, List } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

import { useSystemAlerts } from '../hooks/useSystemStatus'

/**
 * Dispatcher panel banner (task 034): shown only when announcements may not sound
 * right now — the agent is offline, playback is down, and so on. Silent otherwise.
 */
export function SystemAlertsBanner() {
  const alerts = useSystemAlerts()

  if (alerts.isError) {
    return (
      <Alert color="warning" icon={<IconAlertTriangle size={18} />} title="Состояние системы неизвестно">
        Не удалось проверить, работают ли сервисы воспроизведения.
      </Alert>
    )
  }
  if (!alerts.data || alerts.data.length === 0) return null

  return (
    <Alert
      color="danger"
      icon={<IconAlertTriangle size={18} />}
      title="Объявления могут не прозвучать"
      role="alert"
    >
      <List size="sm" spacing={2}>
        {alerts.data.map((alert) => (
          <List.Item key={alert.key}>{alert.message}</List.Item>
        ))}
      </List>
    </Alert>
  )
}
