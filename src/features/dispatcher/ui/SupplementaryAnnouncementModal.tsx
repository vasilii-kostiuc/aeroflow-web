import {
  useLaunchSupplementaryAnnouncement,
  useSupplementaryTemplates,
} from '../hooks/useLaunchSupplementaryAnnouncement'
import { PresetAnnouncementModal } from './PresetAnnouncementModal'

type Props = {
  opened: boolean
  onClose: () => void
}

/**
 * Launch an airport-wide supplementary announcement (task 024) from a preset — the
 * heir of the legacy САО "Дополнительно" set. Not tied to a flight; the server
 * queues the preset audio at priority 50, behind flight announcements.
 */
export function SupplementaryAnnouncementModal({ opened, onClose }: Props) {
  const templatesQuery = useSupplementaryTemplates(opened)
  const launch = useLaunchSupplementaryAnnouncement()

  return (
    <PresetAnnouncementModal
      opened={opened}
      onClose={onClose}
      title="Дополнительное объявление"
      emptyHint="Нет настроенных дополнительных объявлений. Добавьте их в разделе администрирования."
      presets={templatesQuery.data ?? []}
      presetsLoading={templatesQuery.isLoading}
      launch={launch}
      errorTitle="Объявление не запущено"
    />
  )
}
