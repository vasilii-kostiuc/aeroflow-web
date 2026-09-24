import type {
  AnnouncementPreset,
  AnnouncementPresetInput,
  AnnouncementPresetVariant,
} from '@/features/announcement-presets/model/types'

/**
 * An emergency announcement preset (task 026) — heir of the legacy САО "Экстренные"
 * set. Same shape as a supplementary preset; what differs is the launch, which also
 * activates emergency mode.
 */
export type EmergencyTemplateVariant = AnnouncementPresetVariant

export type EmergencyTemplate = AnnouncementPreset

export type EmergencyTemplateInput = AnnouncementPresetInput
