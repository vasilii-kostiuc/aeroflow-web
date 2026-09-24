import type { Language } from '@/features/languages/model/types'

import type {
  AnnouncementTemplateSegmentInput,
  AnnouncementTemplateSegmentType,
  AnnouncementVariant,
  AnnouncementVariantInput,
  AudioAsset,
  DynamicSlotType,
  FlightAnnouncementType,
  FlightDefinition,
} from './types'

export const typeLabels: Record<FlightAnnouncementType, string> = {
  check_in_opening: 'Начало регистрации',
  check_in_continuation: 'Продолжение регистрации',
  check_in_closing: 'Окончание регистрации',
  boarding_invitation: 'Приглашение на посадку',
  arrival: 'Прибытие рейса',
}

export const segmentTypeLabels: Record<AnnouncementTemplateSegmentType, string> = {
  audio_asset: 'Аудиофайл',
  dynamic_slot: 'Динамическое поле',
  pause: 'Пауза',
  text: 'Текст',
}

export const slotLabels: Record<DynamicSlotType, string> = {
  check_in_counters: 'Стойки регистрации',
  gate_code: 'Выход',
}

export const validationErrorLabels: Record<string, string> = {
  configuration_disabled: 'Конфигурация выключена',
  announcement_type_incompatible_with_flight_direction:
    'Тип не соответствует направлению рейса',
  no_active_variants: 'Нет включённых языковых вариантов',
  text_segment_requires_tts: 'Текстовый сегмент ещё не озвучен',
}

export function availableTypes(
  direction: FlightDefinition['direction'],
): FlightAnnouncementType[] {
  if (direction === 'arrival') return ['arrival']

  return [
    'check_in_opening',
    'check_in_continuation',
    'check_in_closing',
    'boarding_invitation',
  ]
}

export function availableSlots(type: FlightAnnouncementType): DynamicSlotType[] {
  if (type === 'boarding_invitation') return ['gate_code']
  if (
    type === 'check_in_opening' ||
    type === 'check_in_continuation' ||
    type === 'check_in_closing'
  ) {
    return ['check_in_counters']
  }

  return []
}

/** «Русский · ru», «English · en» — the native name, never a bare code. */
export function languageLabel(language: Language): string {
  return `${language.nativeName || language.name} · ${language.code}`
}

export function languageOptions(languages: Language[], currentCode?: string) {
  const options = languages.map((language) => ({
    value: language.code,
    label: languageLabel(language),
    disabled: !language.active,
  }))

  if (currentCode && !options.some((option) => option.value === currentCode)) {
    options.push({
      value: currentCode,
      label: `${currentCode} · сохранённое значение`,
      disabled: true,
    })
  }

  return options
}

export function firstActiveLanguage(languages: Language[]): string {
  return languages.find((language) => language.active)?.code ?? ''
}

export function createSegment(
  type: AnnouncementTemplateSegmentType,
  sortOrder: number,
  slot: DynamicSlotType | null,
): AnnouncementTemplateSegmentInput {
  return {
    sortOrder,
    type,
    audioAssetId: null,
    slot: type === 'dynamic_slot' ? slot : null,
    durationMs: type === 'pause' ? 500 : null,
    text: type === 'text' ? '' : null,
  }
}

export function reindexSegments(
  segments: AnnouncementTemplateSegmentInput[],
): AnnouncementTemplateSegmentInput[] {
  return segments.map((segment, index) => ({ ...segment, sortOrder: index + 1 }))
}

/** Variants in display order; ties (legacy duplicate sortOrder) fall back to creation. */
export function orderVariants(variants: AnnouncementVariant[]): AnnouncementVariant[] {
  return [...variants].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
  )
}

/** The editable input of a saved variant, optionally with some fields replaced. */
export function variantInputFrom(
  variant: AnnouncementVariant,
  overrides: Partial<AnnouncementVariantInput> = {},
): AnnouncementVariantInput {
  return {
    languageCode: variant.languageCode,
    sortOrder: variant.sortOrder,
    enabled: variant.enabled,
    segments: reindexSegments(
      [...variant.segments]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((segment) => ({
          sortOrder: segment.sortOrder,
          type: segment.type,
          audioAssetId: segment.audioAssetId,
          slot: segment.slot,
          durationMs: segment.durationMs,
          text: segment.text,
        })),
    ),
    ...overrides,
  }
}

/**
 * Move a variant one position up or down and renumber the list. Returns only the
 * variants whose sortOrder actually changes, with their new value — each is saved
 * as its own request.
 */
export function moveVariant(
  variants: AnnouncementVariant[],
  variantId: string,
  direction: -1 | 1,
): Array<{ variant: AnnouncementVariant; sortOrder: number }> {
  const ordered = orderVariants(variants)
  const index = ordered.findIndex((variant) => variant.id === variantId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= ordered.length) return []

  const next = [...ordered]
  next[index] = ordered[target]
  next[target] = ordered[index]

  return next
    .map((variant, position) => ({ variant, sortOrder: position + 1 }))
    .filter(({ variant, sortOrder }) => variant.sortOrder !== sortOrder)
}

export function normalizeVariant(input: AnnouncementVariantInput): AnnouncementVariantInput {
  return {
    languageCode: input.languageCode.trim(),
    sortOrder: input.sortOrder,
    enabled: input.enabled,
    segments: reindexSegments(
      [...input.segments].sort((a, b) => a.sortOrder - b.sortOrder),
    ).map((segment) => {
      if (segment.type === 'audio_asset') {
        return {
          sortOrder: segment.sortOrder,
          type: segment.type,
          audioAssetId: segment.audioAssetId?.trim() || null,
          slot: null,
          durationMs: null,
          text: null,
        }
      }

      if (segment.type === 'dynamic_slot') {
        return {
          sortOrder: segment.sortOrder,
          type: segment.type,
          audioAssetId: null,
          slot: segment.slot,
          durationMs: null,
          text: null,
        }
      }

      if (segment.type === 'pause') {
        return {
          sortOrder: segment.sortOrder,
          type: segment.type,
          audioAssetId: null,
          slot: null,
          durationMs: segment.durationMs ?? 500,
          text: null,
        }
      }

      return {
        sortOrder: segment.sortOrder,
        type: segment.type,
        audioAssetId: null,
        slot: null,
        durationMs: null,
        text: segment.text?.trim() || null,
      }
    }),
  }
}

export function canSaveSegment(segment: AnnouncementTemplateSegmentInput): boolean {
  if (segment.type === 'audio_asset') return Boolean(segment.audioAssetId)
  if (segment.type === 'dynamic_slot') return Boolean(segment.slot)
  if (segment.type === 'pause') {
    return (
      typeof segment.durationMs === 'number' &&
      segment.durationMs >= 100 &&
      segment.durationMs <= 10000
    )
  }

  return Boolean(segment.text?.trim())
}

export function canSaveVariant(input: AnnouncementVariantInput): boolean {
  return (
    Boolean(input.languageCode.trim()) &&
    input.segments.length > 0 &&
    input.segments.every(canSaveSegment)
  )
}

export function variantSaveHint(input: AnnouncementVariantInput): string | null {
  if (!input.languageCode.trim()) return 'Выберите язык варианта.'
  if (input.segments.length === 0) return 'Добавьте хотя бы один сегмент.'
  if (!input.segments.every(canSaveSegment)) {
    return 'Заполните обязательные поля во всех сегментах.'
  }

  return null
}

export function segmentTypeOptions(announcementType: FlightAnnouncementType) {
  const slots = availableSlots(announcementType)

  return (Object.keys(segmentTypeLabels) as AnnouncementTemplateSegmentType[])
    .filter((type) => type !== 'dynamic_slot' || slots.length > 0)
    .map((type) => ({
      value: type,
      label: segmentTypeLabels[type],
    }))
}

export function segmentSummary(
  segment: AnnouncementTemplateSegmentInput,
  audioAssets: AudioAsset[],
): string {
  if (segment.type === 'audio_asset') {
    const asset = audioAssets.find((item) => item.id === segment.audioAssetId)
    return asset
      ? `${asset.title} · ${asset.languageCode}`
      : segment.audioAssetId || 'Аудиофайл не выбран'
  }

  if (segment.type === 'dynamic_slot') {
    return segment.slot ? slotLabels[segment.slot] : 'Поле не выбрано'
  }

  if (segment.type === 'pause') {
    return `${segment.durationMs ?? 500} мс`
  }

  return segment.text?.trim() || 'Текст не задан'
}

/**
 * One line describing what a variant says: its text when it is a single text
 * segment, otherwise the sequence of its parts («Аудиофайл · Стойки · Пауза 500 мс»).
 */
export function variantSummary(
  segments: AnnouncementTemplateSegmentInput[],
  audioAssets: AudioAsset[],
): string {
  if (segments.length === 0) return 'Нет сегментов'

  const ordered = [...segments].sort((a, b) => a.sortOrder - b.sortOrder)
  if (ordered.length === 1) return segmentSummary(ordered[0], audioAssets)

  return ordered
    .map((segment) => {
      if (segment.type === 'text') return `«${segment.text?.trim() ?? ''}»`
      if (segment.type === 'pause') return `пауза ${segment.durationMs ?? 500} мс`
      if (segment.type === 'dynamic_slot') {
        return segment.slot ? slotLabels[segment.slot] : 'поле'
      }

      return segmentSummary(segment, audioAssets)
    })
    .join(' · ')
}

/** The single playable file of a one-segment variant, if it has one. */
export function singleAudioAssetId(
  segments: AnnouncementTemplateSegmentInput[],
): string | null {
  return segments.length === 1 ? segments[0].audioAssetId : null
}
