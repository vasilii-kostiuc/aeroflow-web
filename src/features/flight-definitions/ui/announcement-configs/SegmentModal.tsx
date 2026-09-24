import { useState } from 'react'

import {
  Alert,
  Button,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'

import { ApiClientError } from '@/shared/api/apiClient'
import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import { useUploadAudioAsset } from '../../hooks/useFlightDefinitions'
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
  AudioAsset,
  DynamicSlotType,
  FlightAnnouncementType,
} from '../../model/types'

export function SegmentModal({
  opened,
  announcementType,
  languageCode,
  segment,
  audioAssets,
  onClose,
  onSubmit,
}: {
  opened: boolean
  announcementType: FlightAnnouncementType
  languageCode: string
  segment: AnnouncementTemplateSegmentInput
  audioAssets: AudioAsset[]
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
          <Stack gap="xs">
            <Group align="flex-end" wrap="nowrap" gap="xs">
              <Select
                label="Аудиофайл"
                placeholder="Выберите файл"
                searchable
                style={{ flex: 1 }}
                data={audioAssets.map((asset) => ({
                  value: asset.id,
                  label:
                    asset.languageCode === languageCode
                      ? `${asset.name} · ${asset.languageCode}`
                      : `${asset.name} · ${asset.languageCode} · другой язык`,
                  disabled: !asset.active,
                }))}
                value={draft.audioAssetId}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, audioAssetId: value }))
                }
              />
              <AudioPreviewButton audioAssetId={draft.audioAssetId} />
            </Group>
            <AudioAssetUploader
              languageCode={languageCode}
              onUploaded={(audioAssetId) =>
                setDraft((current) => ({ ...current, audioAssetId }))
              }
            />
          </Stack>
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

function AudioAssetUploader({
  languageCode,
  onUploaded,
}: {
  languageCode: string
  onUploaded: (audioAssetId: string) => void
}) {
  const uploadMutation = useUploadAudioAsset()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function upload() {
    if (!file || !languageCode.trim()) return

    setError(null)
    try {
      const asset = await uploadMutation.mutateAsync({
        file,
        languageCode: languageCode.trim(),
      })
      onUploaded(asset.id)
      setFile(null)
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiClientError
          ? uploadError.message
          : 'Не удалось загрузить аудиофайл.',
      )
    }
  }

  return (
    <Stack gap="xs">
      <Group align="flex-end">
        <FileInput
          flex={1}
          label="Загрузить новый аудиофайл"
          description="WAV, MP3 или OGG, не более 50 МБ"
          accept="audio/wav,audio/x-wav,audio/mpeg,audio/ogg,.wav,.mp3,.ogg"
          clearable
          value={file}
          onChange={setFile}
        />
        <Button
          variant="light"
          leftSection={<IconUpload size={16} />}
          loading={uploadMutation.isPending}
          disabled={!file || !languageCode.trim()}
          onClick={() => void upload()}
        >
          Загрузить
        </Button>
      </Group>
      {error && <Alert color="danger">{error}</Alert>}
    </Stack>
  )
}
