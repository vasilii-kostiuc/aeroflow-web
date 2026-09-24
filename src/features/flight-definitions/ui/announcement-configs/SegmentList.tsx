import { useMemo, useState } from 'react'

import { ActionIcon, Badge, Button, Group, Paper, Stack, Text, Tooltip } from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'

import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import {
  availableSlots,
  createSegment,
  reindexSegments,
  segmentSummary,
  segmentTypeLabels,
} from '../../model/announcementConfig'
import type {
  AnnouncementTemplateSegmentInput,
  AudioAsset,
  FlightAnnouncementType,
} from '../../model/types'
import { SegmentModal } from './SegmentModal'

type SegmentModalState = {
  index: number | null
  segment: AnnouncementTemplateSegmentInput
}

export function SegmentList({
  announcementType,
  languageCode,
  ariaContext,
  segments,
  audioAssets,
  onChange,
}: {
  announcementType: FlightAnnouncementType
  languageCode: string
  ariaContext: string
  segments: AnnouncementTemplateSegmentInput[]
  audioAssets: AudioAsset[]
  onChange: (segments: AnnouncementTemplateSegmentInput[]) => void
}) {
  const [modal, setModal] = useState<SegmentModalState | null>(null)
  const orderedSegments = useMemo(
    () => reindexSegments([...segments].sort((a, b) => a.sortOrder - b.sortOrder)),
    [segments],
  )

  function replaceSegments(next: AnnouncementTemplateSegmentInput[]) {
    onChange(reindexSegments(next))
  }

  function saveSegment(segment: AnnouncementTemplateSegmentInput) {
    if (modal?.index === null) {
      replaceSegments([...orderedSegments, segment])
    } else if (modal) {
      replaceSegments(
        orderedSegments.map((item, index) =>
          index === modal.index ? { ...segment, sortOrder: item.sortOrder } : item,
        ),
      )
    }
    setModal(null)
  }

  function removeSegment(index: number) {
    replaceSegments(orderedSegments.filter((_, currentIndex) => currentIndex !== index))
  }

  function moveSegment(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= orderedSegments.length) return

    const next = [...orderedSegments]
    const current = next[index]
    next[index] = next[target]
    next[target] = current
    replaceSegments(next)
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">
          Сегменты
        </Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={() =>
            setModal({
              index: null,
              segment: createSegment(
                'audio_asset',
                orderedSegments.length + 1,
                availableSlots(announcementType)[0] ?? null,
              ),
            })
          }
        >
          Добавить сегмент
        </Button>
      </Group>

      {orderedSegments.length === 0 ? (
        <Text size="sm" c="dimmed">
          Сегментов пока нет.
        </Text>
      ) : (
        <Stack gap="xs">
          {orderedSegments.map((segment, index) => (
            <Paper key={`${segment.type}-${index}`} withBorder p="xs">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <Badge variant="light">#{index + 1}</Badge>
                  <Stack gap={0}>
                    <Text fw={600} size="sm">
                      {segmentTypeLabels[segment.type]}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {segmentSummary(segment, audioAssets)}
                    </Text>
                  </Stack>
                </Group>
                <Group gap={4} wrap="nowrap">
                  <Tooltip label="Выше">
                    <ActionIcon
                      variant="subtle"
                      aria-label={`Переместить сегмент ${index + 1} выше (${ariaContext})`}
                      disabled={index === 0}
                      onClick={() => moveSegment(index, -1)}
                    >
                      <IconArrowUp size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Ниже">
                    <ActionIcon
                      variant="subtle"
                      aria-label={`Переместить сегмент ${index + 1} ниже (${ariaContext})`}
                      disabled={index === orderedSegments.length - 1}
                      onClick={() => moveSegment(index, 1)}
                    >
                      <IconArrowDown size={16} />
                    </ActionIcon>
                  </Tooltip>
                  {segment.audioAssetId ? (
                    <AudioPreviewButton audioAssetId={segment.audioAssetId} />
                  ) : null}
                  <Tooltip label="Редактировать">
                    <ActionIcon
                      variant="subtle"
                      aria-label={`Редактировать сегмент ${index + 1} (${ariaContext})`}
                      onClick={() => setModal({ index, segment })}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Удалить">
                    <ActionIcon
                      variant="subtle"
                      color="danger"
                      aria-label={`Удалить сегмент ${index + 1} (${ariaContext})`}
                      onClick={() => removeSegment(index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      {modal && (
        <SegmentModal
          opened
          announcementType={announcementType}
          languageCode={languageCode}
          segment={modal.segment}
          onClose={() => setModal(null)}
          onSubmit={saveSegment}
        />
      )}
    </Stack>
  )
}
