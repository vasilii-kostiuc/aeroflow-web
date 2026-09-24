import { ActionIcon, Button, Group, Paper, Switch, Text, Tooltip } from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconEdit, IconTrash } from '@tabler/icons-react'

import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import {
  singleAudioAssetId,
  variantInputFrom,
  variantSummary,
} from '../../model/announcementConfig'
import type { AnnouncementVariant, AudioAsset } from '../../model/types'

type Props = {
  variant: AnnouncementVariant
  languageLabel: string
  audioAssets: AudioAsset[]
  isFirst: boolean
  isLast: boolean
  /** Another variant is open in the editor, so this one cannot be opened too. */
  editLocked: boolean
  /** A row action (toggle, move, delete) is in flight for this config. */
  busy: boolean
  onEdit: () => void
  onToggle: (enabled: boolean) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
}

/**
 * A saved language variant, read-only. Toggling, moving and deleting apply at
 * once; changing what it says goes through the editor, one variant at a time.
 */
export function VariantRow({
  variant,
  languageLabel,
  audioAssets,
  isFirst,
  isLast,
  editLocked,
  busy,
  onEdit,
  onToggle,
  onMove,
  onDelete,
}: Props) {
  const segments = variantInputFrom(variant).segments
  const previewAssetId = singleAudioAssetId(segments)

  return (
    <Paper withBorder p="xs" opacity={variant.enabled ? 1 : 0.6}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap={2} wrap="nowrap">
          <Tooltip label="Выше">
            <ActionIcon
              variant="subtle"
              aria-label={`Переместить язык ${variant.languageCode} выше`}
              disabled={isFirst || busy}
              onClick={() => onMove(-1)}
            >
              <IconArrowUp size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Ниже">
            <ActionIcon
              variant="subtle"
              aria-label={`Переместить язык ${variant.languageCode} ниже`}
              disabled={isLast || busy}
              onClick={() => onMove(1)}
            >
              <IconArrowDown size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm">
            {languageLabel}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={1}>
            {variantSummary(segments, audioAssets)}
          </Text>
        </div>

        <Group gap="xs" wrap="nowrap">
          {previewAssetId ? <AudioPreviewButton audioAssetId={previewAssetId} /> : null}
          <Switch
            aria-label={`Язык ${variant.languageCode} включён`}
            checked={variant.enabled}
            disabled={busy}
            onChange={(event) => onToggle(event.currentTarget.checked)}
          />
          <Button
            size="xs"
            variant="light"
            leftSection={<IconEdit size={14} />}
            disabled={editLocked}
            onClick={onEdit}
          >
            Изменить
          </Button>
          <Tooltip label="Удалить">
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label={`Удалить язык ${variant.languageCode}`}
              disabled={busy}
              onClick={onDelete}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Paper>
  )
}
