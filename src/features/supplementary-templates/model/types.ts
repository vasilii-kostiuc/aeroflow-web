/** One language variant of a preset: the audio asset that voices it in that language. */
export type SupplementaryTemplateVariant = {
  languageCode: string
  audioAssetId: string
}

/**
 * A reusable supplementary announcement preset (task 024) — heir of the legacy САО
 * "Дополнительно" set. Admin-managed: a name plus per-language pre-recorded/generated
 * audio.
 */
export type SupplementaryTemplate = {
  id: string
  name: string
  variants: SupplementaryTemplateVariant[]
  languageCodes: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export type SupplementaryTemplateInput = {
  name: string
  variants: SupplementaryTemplateVariant[]
}

/** Active audio asset available to voice a preset variant. */
export type AudioAsset = {
  id: string
  name: string
  languageCode: string
  active: boolean
}
