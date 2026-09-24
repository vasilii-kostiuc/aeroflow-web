import { useState } from 'react'

import { AnnouncementPresetsScreen } from '@/features/announcement-presets/ui/AnnouncementPresetsScreen'
import {
  useChangeEmergencyTemplateStatus,
  useEmergencyTemplates,
} from '@/features/emergency-templates/hooks/useEmergencyTemplates'
import type { EmergencyTemplate } from '@/features/emergency-templates/model/types'
import { EmergencyTemplateForm } from '@/features/emergency-templates/ui/EmergencyTemplateForm'

export function EmergencyTemplatesPage() {
  const [editing, setEditing] = useState<EmergencyTemplate | null | undefined>()
  const templates = useEmergencyTemplates()
  const status = useChangeEmergencyTemplateStatus()

  return (
    <AnnouncementPresetsScreen
      title="Экстренные объявления"
      description="Заранее озвученные экстренные сообщения. Запуск такого объявления прерывает звучащее и останавливает обычную очередь."
      addLabel="Добавить объявление"
      emptyText="Экстренные объявления ещё не настроены."
      loadErrorText="Не удалось загрузить экстренные объявления."
      loadingLabel="Загрузка объявлений"
      presets={templates.data}
      isPending={templates.isPending}
      isError={templates.isError}
      onAdd={() => setEditing(null)}
      onEdit={setEditing}
      onChangeStatus={(preset) =>
        status.mutate({ id: preset.id, active: !preset.active })
      }
      form={
        editing !== undefined ? (
          <EmergencyTemplateForm
            template={editing}
            onClose={() => setEditing(undefined)}
          />
        ) : undefined
      }
    />
  )
}
