import type { AnnouncementPresetInput } from '@/features/announcement-presets/model/types'
import { AnnouncementPresetForm } from '@/features/announcement-presets/ui/AnnouncementPresetForm'

import {
  useAudioAssets,
  useCreateEmergencyTemplate,
  useGenerateAudioAsset,
  useUpdateEmergencyTemplate,
} from '../hooks/useEmergencyTemplates'
import type { EmergencyTemplate } from '../model/types'

type Props = {
  template: EmergencyTemplate | null
  onClose: () => void
}

/**
 * Create or edit an emergency announcement preset (task 026) — the same editor as
 * the supplementary catalog, bound to this catalog's queries and mutations.
 */
export function EmergencyTemplateForm({ template, onClose }: Props) {
  const create = useCreateEmergencyTemplate()
  const update = useUpdateEmergencyTemplate()
  const generate = useGenerateAudioAsset()
  const assets = useAudioAssets()

  const submit = (input: AnnouncementPresetInput) =>
    template ? update.mutateAsync({ id: template.id, input }) : create.mutateAsync(input)

  return (
    <AnnouncementPresetForm
      preset={template}
      onClose={onClose}
      title={template ? 'Редактировать объявление' : 'Новое экстренное объявление'}
      namePlaceholder="Например, Пожарная тревога"
      assets={assets}
      generate={generate}
      submit={submit}
      pending={template ? update.isPending : create.isPending}
    />
  )
}
