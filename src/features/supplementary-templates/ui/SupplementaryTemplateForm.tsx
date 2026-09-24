import { AnnouncementPresetForm } from '@/features/announcement-presets/ui/AnnouncementPresetForm'
import type { AnnouncementPresetInput } from '@/features/announcement-presets/model/types'

import {
  useCreateSupplementaryTemplate,
  useUpdateSupplementaryTemplate,
} from '../hooks/useSupplementaryTemplates'
import type { SupplementaryTemplate } from '../model/types'

type Props = {
  template: SupplementaryTemplate | null
  onClose: () => void
}

/**
 * Create or edit a supplementary announcement preset (task 024). The screen itself
 * is the shared preset editor; this wrapper only binds it to this catalog's queries
 * and mutations.
 */
export function SupplementaryTemplateForm({ template, onClose }: Props) {
  const create = useCreateSupplementaryTemplate()
  const update = useUpdateSupplementaryTemplate()

  const submit = (input: AnnouncementPresetInput) =>
    template ? update.mutateAsync({ id: template.id, input }) : create.mutateAsync(input)

  return (
    <AnnouncementPresetForm
      preset={template}
      onClose={onClose}
      title={template ? 'Редактировать объявление' : 'Новое дополнительное объявление'}
      namePlaceholder="Например, Безопасность"
      placeKey="preset:supplementary"
      submit={submit}
      pending={template ? update.isPending : create.isPending}
    />
  )
}
