import { useState } from 'react'

import { Button, Group, Modal, NumberInput, Select, Stack, Textarea } from '@mantine/core'

import { AudioAssetPicker } from '@/features/audio-assets/ui/AudioAssetPicker'

import {
  availableSlots,
  canSaveSegment,
  createSegment,
  segmentTypeOptions,
  slotLabels,
} from '../../model/announcementConfig'
import type {
  AnnouncementTemplateSegmentInput,
  AnnouncementTemplateSegmentType,
  DynamicSlotType,
  FlightAnnouncementType,
} from '../../model/types'

export function SegmentModal({
  opened,
  announcementType,
  languageCode,
  segment,
  onClose,
  onSubmit,
}: {
  opened: boolean
  announcementType: FlightAnnouncementType
  languageCode: string
  segment: AnnouncementTemplateSegmentInput
  onClose: () => void
  onSubmit: (segment: AnnouncementTemplateSegmentInput) => void
}) {
  const [draft, setDraft] = useState<AnnouncementTemplateSegmentInput>(segment)
  const options = segmentTypeOptions(announcementType)

  function changeType(type: AnnouncementTemplateSegmentType) {
    setDraft(createSegment(type, draft.sortOrder, availableSlots(announcementType)[0] ?? null))
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Сегмент объявления" centered>
      <Stack>
        <Select
          label="Тип"
          allowDeselect={false}
          data={options}
          value={draft.type}
          onChange={(value) =>
            changeType((value ?? 'audio_asset') as AnnouncementTemplateSegmentType)
          }
        />

        {draft.type === 'audio_asset' && (
          <AudioAssetPicker
            label="Аудиофайл"
            value={draft.audioAssetId}
            onChange={(audioAssetId) =>
              setDraft((current) => ({ ...current, audioAssetId }))
            }
            languageCode={languageCode}
            placeKey={`segment:${announcementType}`}
          />
        )}

        {draft.type === 'dynamic_slot' && (
          <Select
            label="Поле"
            allowDeselect={false}
            data={availableSlots(announcementType).map((slot) => ({
              value: slot,
              label: slotLabels[slot],
            }))}
            value={draft.slot}
            onChange={(value) =>
              setDraft((current) => ({ ...current, slot: value as DynamicSlotType }))
            }
          />
        )}

        {draft.type === 'pause' && (
          <NumberInput
            label="Длительность, мс"
            min={100}
            max={10000}
            step={100}
            value={draft.durationMs ?? 500}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                durationMs: typeof value === 'number' ? value : 500,
              }))
            }
          />
        )}

        {draft.type === 'text' && (
          <Textarea
            label="Текст"
            description="Текст озвучивается автоматически при сохранении варианта."
            minRows={3}
            value={draft.text ?? ''}
            onChange={(event) => {
              const text = event.currentTarget.value
              setDraft((current) => ({ ...current, text }))
            }}
          />
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button disabled={!canSaveSegment(draft)} onClick={() => onSubmit(draft)}>
            Сохранить сегмент
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
