import {
  useEmergencyTemplates,
  useLaunchEmergencyAnnouncement,
} from '../hooks/useEmergencyAnnouncement'
import { PresetAnnouncementModal } from './PresetAnnouncementModal'

type Props = {
  opened: boolean
  onClose: () => void
}

/**
 * Launch an emergency announcement (task 026) from a preset — the heir of the legacy
 * САО "Экстренные" set. One action with two effects on the server: the announcement
 * preempts whatever is sounding, and emergency mode suspends the ordinary queue until
 * the dispatcher lifts it from the panel banner.
 */
export function EmergencyAnnouncementModal({ opened, onClose }: Props) {
  const templatesQuery = useEmergencyTemplates(opened)
  const launch = useLaunchEmergencyAnnouncement()

  return (
    <PresetAnnouncementModal
      opened={opened}
      onClose={onClose}
      title="Экстренное объявление"
      submitLabel="Запустить экстренное"
      submitColor="danger"
      notice="Экстренное объявление прервёт звучащее и остановит обычную очередь, пока режим не будет снят."
      emptyHint="Нет настроенных экстренных объявлений. Добавьте их в разделе администрирования."
      presets={templatesQuery.data ?? []}
      presetsLoading={templatesQuery.isLoading}
      launch={launch}
      errorTitle="Экстренное объявление не запущено"
    />
  )
}
