/** One language variant of a preset: the audio asset that voices it in that language. */
export type AnnouncementPresetVariant = {
  languageCode: string
  audioAssetId: string
}

/**
 * An admin-managed announcement preset: a name plus per-language pre-recorded or
 * generated audio. Supplementary presets (task 024, heir of the legacy САО
 * "Дополнительно" set) and emergency presets (task 026, heir of "Экстренные") share
 * this shape and this screen; they differ only in what launching one does.
 */
export type AnnouncementPreset = {
  id: string
  name: string
  variants: AnnouncementPresetVariant[]
  languageCodes: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export type AnnouncementPresetInput = {
  name: string
  variants: AnnouncementPresetVariant[]
}

/** Active audio asset available to voice a preset variant. */
export type AudioAsset = {
  id: string
  name: string
  languageCode: string
  active: boolean
}

/** The slices of a TanStack query/mutation the preset screens actually use. */
export type AudioAssetsQuery = {
  data?: AudioAsset[]
  isLoading: boolean
}

export type GenerateAudioAssetMutation = {
  mutateAsync: (input: { text: string; languageCode: string }) => Promise<AudioAsset>
}
