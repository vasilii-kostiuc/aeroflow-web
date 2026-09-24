import { useEffect, useState } from 'react'

import { Alert, Box, Button, Group, Select, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import type { Language } from '@/features/languages/model/types'
import { confirmDiscardChanges } from '@/shared/lib/useUnsavedChangesGuard'

import {
  canSaveVariant,
  languageOptions,
  normalizeVariant,
  variantSaveHint,
} from '../../model/announcementConfig'
import type {
  AnnouncementVariantInput,
  AudioAsset,
  FlightAnnouncementType,
} from '../../model/types'
import { SegmentList } from './SegmentList'

type Props = {
  title: string
  announcementType: FlightAnnouncementType
  initial: AnnouncementVariantInput
  languages: Language[]
  languagesLoading: boolean
  audioAssets: AudioAsset[]
  saving: boolean
  error: string | null
  /** Language and segments of the draft; position and enabled stay with the row. */
  onSave: (draft: AnnouncementVariantInput) => void
  onCancel: () => void
  onDirtyChange: (dirty: boolean) => void
}

/** What the editor changes — compared to tell whether the draft is dirty. */
function editableContent(input: AnnouncementVariantInput): string {
  const { languageCode, segments } = normalizeVariant(input)

  return JSON.stringify({ languageCode, segments })
}

/**
 * The one open editor of a language variant: its language and segments, with a
 * single Save / Cancel. Saving voices text segments (task 022), which can take a
 * few seconds, so the editor says so.
 */
export function VariantEditor({
  title,
  announcementType,
  initial,
  languages,
  languagesLoading,
  audioAssets,
  saving,
  error,
  onSave,
  onCancel,
  onDirtyChange,
}: Props) {
  const [draft, setDraft] = useState<AnnouncementVariantInput>(initial)
  const dirty = editableContent(draft) !== editableContent(initial)
  const hint = variantSaveHint(draft)
  const voicesText = draft.segments.some((segment) => segment.type === 'text')

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const cancel = () => (dirty ? confirmDiscardChanges(onCancel) : onCancel())

  return (
    <Box
      p="md"
      bg="var(--mantine-color-blue-light)"
      style={{ borderLeft: '3px solid var(--mantine-color-blue-filled)' }}
    >
      <Stack gap="sm">
        <Text fw={600}>{title}</Text>

        <Select
          label="Язык"
          placeholder={languagesLoading ? 'Загрузка языков...' : 'Выберите язык'}
          searchable
          allowDeselect={false}
          disabled={languagesLoading}
          data={languageOptions(languages, draft.languageCode)}
          value={draft.languageCode || null}
          onChange={(next) =>
            setDraft((current) => ({ ...current, languageCode: next ?? '' }))
          }
          maw={360}
        />

        <SegmentList
          announcementType={announcementType}
          languageCode={draft.languageCode}
          ariaContext={`варианта ${draft.languageCode || 'нового языка'}`}
          segments={draft.segments}
          audioAssets={audioAssets}
          onChange={(segments) => setDraft((current) => ({ ...current, segments }))}
        />

        {hint ? (
          <Text size="xs" c="dimmed">
            {hint}
          </Text>
        ) : null}

        {error ? (
          <Alert color="danger" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        ) : null}

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {voicesText ? 'Текстовые сегменты озвучиваются при сохранении — это может занять несколько секунд.' : ''}
          </Text>
          <Group gap="xs">
            <Button variant="default" onClick={cancel} disabled={saving}>
              Отмена
            </Button>
            <Button
              loading={saving}
              disabled={!canSaveVariant(draft) || !dirty}
              onClick={() => onSave(normalizeVariant(draft))}
            >
              Сохранить
            </Button>
          </Group>
        </Group>
      </Stack>
    </Box>
  )
}
