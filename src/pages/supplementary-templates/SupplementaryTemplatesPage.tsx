import { useState } from 'react'

import { AnnouncementPresetsScreen } from '@/features/announcement-presets/ui/AnnouncementPresetsScreen'
import {
  useChangeSupplementaryTemplateStatus,
  useSupplementaryTemplates,
} from '@/features/supplementary-templates/hooks/useSupplementaryTemplates'
import type { SupplementaryTemplate } from '@/features/supplementary-templates/model/types'
import { SupplementaryTemplateForm } from '@/features/supplementary-templates/ui/SupplementaryTemplateForm'

export function SupplementaryTemplatesPage() {
  const [editing, setEditing] = useState<SupplementaryTemplate | null | undefined>()
  const templates = useSupplementaryTemplates()
  const status = useChangeSupplementaryTemplateStatus()

  return (
    <AnnouncementPresetsScreen
      title="Дополнительные объявления"
      description="Набор информационных объявлений аэропорта, которые диспетчер запускает из панели."
      addLabel="Добавить объявление"
      emptyText="Дополнительные объявления ещё не настроены."
      loadErrorText="Не удалось загрузить дополнительные объявления."
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
          <SupplementaryTemplateForm
            template={editing}
            onClose={() => setEditing(undefined)}
          />
        ) : undefined
      }
    />
  )
}
