import type {
  AnnouncementPreset,
  AnnouncementPresetInput,
  AnnouncementPresetVariant,
} from '@/features/announcement-presets/model/types'

/**
 * A supplementary announcement preset (task 024) — heir of the legacy САО
 * "Дополнительно" set. Shape-wise it is the shared announcement preset; the feature
 * keeps its own names so its API and hooks read in its own language.
 */
export type SupplementaryTemplateVariant = AnnouncementPresetVariant

export type SupplementaryTemplate = AnnouncementPreset

export type SupplementaryTemplateInput = AnnouncementPresetInput
