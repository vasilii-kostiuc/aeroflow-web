import { Fragment, useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconAlertCircle, IconPlus } from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'

import {
  useAddAnnouncementVariant,
  useAudioAssets,
  useDeleteAnnouncementVariant,
  useUpdateAnnouncementVariant,
  useUpdateFlightAnnouncementConfig,
} from '../../hooks/useFlightDefinitions'
import {
  languageLabel,
  moveVariant,
  orderVariants,
  typeLabels,
  validationErrorLabels,
  variantInputFrom,
} from '../../model/announcementConfig'
import type {
  AnnouncementVariant,
  AnnouncementVariantInput,
  FlightAnnouncementConfig,
} from '../../model/types'
import { VariantEditor } from './VariantEditor'
import { VariantRow } from './VariantRow'

type Editing = { kind: 'new' } | { kind: 'existing'; variantId: string } | null

type Props = {
  config: FlightAnnouncementConfig
  flightDefinitionId: string
  /** Reports whether this card holds unsaved edits (open editor or interval). */
  onDirtyChange: (dirty: boolean) => void
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback
}

function ConfigStatus({ config }: { config: FlightAnnouncementConfig }) {
  if (!config.enabled) return <Badge color="gray">Выключено</Badge>

  return config.isValidForDispatcher ? (
    <Badge color="success">Готово</Badge>
  ) : (
    <Badge color="warning">Требует настройки</Badge>
  )
}

/**
 * One announcement type of a flight: its settings and its language variants.
 * Variants are read-only rows; at most one is open in the editor at a time, so an
 * edit can never be left half-saved next to another one.
 */
export function AnnouncementConfigCard({ config, flightDefinitionId, onDirtyChange }: Props) {
  const updateConfig = useUpdateFlightAnnouncementConfig(flightDefinitionId)
  const addVariant = useAddAnnouncementVariant(flightDefinitionId)
  const updateVariant = useUpdateAnnouncementVariant(flightDefinitionId)
  const deleteVariant = useDeleteAnnouncementVariant(flightDefinitionId)
  const audioAssets = useAudioAssets()
  const languages = useLanguages()

  const [editing, setEditing] = useState<Editing>(null)
  const [editorDirty, setEditorDirty] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [rowBusy, setRowBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interval, setRepeatInterval] = useState<number | null>(config.repeatEveryMinutes)

  const isContinuation = config.announcementType === 'check_in_continuation'
  const intervalValid = interval !== null && interval >= 1 && interval <= 120
  const intervalDirty = isContinuation && interval !== config.repeatEveryMinutes

  useEffect(() => onDirtyChange(editorDirty || intervalDirty), [
    editorDirty,
    intervalDirty,
    onDirtyChange,
  ])

  const variants = useMemo(() => orderVariants(config.variants), [config.variants])
  const labelByCode = useMemo(
    () => new Map((languages.data ?? []).map((language) => [language.code, languageLabel(language)])),
    [languages.data],
  )
  const labelOf = (code: string) => labelByCode.get(code) ?? code
  // A new variant starts on the first active language the type does not speak yet.
  const nextLanguage =
    (languages.data ?? []).find(
      (language) =>
        language.active &&
        !config.variants.some((variant) => variant.languageCode === language.code),
    )?.code ?? ''

  async function runRowAction(action: () => Promise<unknown>, fallback: string) {
    setError(null)
    setRowBusy(true)
    try {
      await action()
    } catch (actionError) {
      setError(errorMessage(actionError, fallback))
    } finally {
      setRowBusy(false)
    }
  }

  function saveSettings(enabled: boolean, repeatEveryMinutes: number | null) {
    void runRowAction(
      () =>
        updateConfig.mutateAsync({
          configId: config.id,
          input: { enabled, repeatEveryMinutes: isContinuation ? repeatEveryMinutes : null },
        }),
      'Не удалось сохранить настройки объявления.',
    )
  }

  function toggleVariant(variant: AnnouncementVariant, enabled: boolean) {
    void runRowAction(
      () =>
        updateVariant.mutateAsync({
          configId: config.id,
          variantId: variant.id,
          input: variantInputFrom(variant, { enabled }),
        }),
      'Не удалось изменить язык.',
    )
  }

  function move(variant: AnnouncementVariant, direction: -1 | 1) {
    void runRowAction(async () => {
      for (const change of moveVariant(config.variants, variant.id, direction)) {
        await updateVariant.mutateAsync({
          configId: config.id,
          variantId: change.variant.id,
          input: variantInputFrom(change.variant, { sortOrder: change.sortOrder }),
        })
      }
    }, 'Не удалось изменить порядок языков.')
  }

  function confirmDelete(variant: AnnouncementVariant) {
    modals.openConfirmModal({
      title: `Удалить язык «${labelOf(variant.languageCode)}»?`,
      children: (
        <Text size="sm">
          Объявление «{typeLabels[config.announcementType]}» перестанет звучать на этом
          языке.
        </Text>
      ),
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'danger' },
      onConfirm: () =>
        void runRowAction(
          () => deleteVariant.mutateAsync({ configId: config.id, variantId: variant.id }),
          'Не удалось удалить язык.',
        ),
    })
  }

  function closeEditor() {
    setEditing(null)
    setEditorError(null)
  }

  async function saveDraft(draft: AnnouncementVariantInput) {
    setEditorError(null)
    try {
      if (editing?.kind === 'existing') {
        const current = config.variants.find((variant) => variant.id === editing.variantId)
        await updateVariant.mutateAsync({
          configId: config.id,
          variantId: editing.variantId,
          // Position and enabled belong to the row and may have changed meanwhile.
          input: {
            ...draft,
            sortOrder: current?.sortOrder ?? draft.sortOrder,
            enabled: current?.enabled ?? draft.enabled,
          },
        })
      } else {
        const lastOrder = Math.max(0, ...config.variants.map((variant) => variant.sortOrder))
        await addVariant.mutateAsync({
          configId: config.id,
          input: { ...draft, sortOrder: lastOrder + 1, enabled: true },
        })
      }
      closeEditor()
    } catch (saveError) {
      setEditorError(errorMessage(saveError, 'Не удалось сохранить язык.'))
    }
  }

  const editorProps = {
    announcementType: config.announcementType,
    languages: languages.data ?? [],
    languagesLoading: languages.isLoading,
    audioAssets: audioAssets.data ?? [],
    saving: addVariant.isPending || updateVariant.isPending,
    error: editorError,
    onSave: (draft: AnnouncementVariantInput) => void saveDraft(draft),
    onCancel: closeEditor,
    onDirtyChange: setEditorDirty,
  }

  const reasons = config.validationErrors
    .filter((reason) => reason !== 'configuration_disabled')
    .map((reason) => validationErrorLabels[reason] ?? reason)

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Title order={5}>{typeLabels[config.announcementType]}</Title>
              <ConfigStatus config={config} />
            </Group>
            <Switch
              label="Включено"
              checked={config.enabled}
              disabled={rowBusy}
              onChange={(event) =>
                saveSettings(event.currentTarget.checked, config.repeatEveryMinutes)
              }
            />
          </Group>

          {config.enabled && reasons.length > 0 ? (
            <Alert color="warning" title="Диспетчер пока не может запустить это объявление">
              {reasons.join('. ')}
            </Alert>
          ) : null}

          {isContinuation ? (
            <Group align="flex-end" gap="xs">
              <NumberInput
                label="Повторять каждые, минут"
                min={1}
                max={120}
                w={220}
                value={interval ?? ''}
                onChange={(value) => setRepeatInterval(typeof value === 'number' ? value : null)}
              />
              <Button
                variant="light"
                disabled={!intervalDirty || !intervalValid}
                loading={updateConfig.isPending}
                onClick={() => saveSettings(config.enabled, interval)}
              >
                Сохранить интервал
              </Button>
            </Group>
          ) : null}
        </Stack>
      </Paper>

      <Stack gap="xs">
        <Text fw={600}>Языки</Text>

        {variants.length === 0 && editing?.kind !== 'new' ? (
          <Text size="sm" c="dimmed">
            Языков пока нет — добавьте первый.
          </Text>
        ) : null}

        {variants.length > 0 || editing?.kind === 'new' ? (
          <Paper withBorder style={{ overflow: 'hidden' }}>
            {variants.map((variant, index) => (
              <Fragment key={variant.id}>
                {index > 0 ? <Divider /> : null}
                {editing?.kind === 'existing' && editing.variantId === variant.id ? (
                  <VariantEditor
                    {...editorProps}
                    title={labelOf(variant.languageCode)}
                    initial={variantInputFrom(variant)}
                  />
                ) : (
                  <VariantRow
                    variant={variant}
                    languageLabel={labelOf(variant.languageCode)}
                    audioAssets={audioAssets.data ?? []}
                    isFirst={index === 0}
                    isLast={index === variants.length - 1}
                    editLocked={editing !== null}
                    busy={rowBusy}
                    onEdit={() => setEditing({ kind: 'existing', variantId: variant.id })}
                    onToggle={(enabled) => toggleVariant(variant, enabled)}
                    onMove={(direction) => move(variant, direction)}
                    onDelete={() => confirmDelete(variant)}
                  />
                )}
              </Fragment>
            ))}
            {editing?.kind === 'new' ? (
              <>
                {variants.length > 0 ? <Divider /> : null}
                <VariantEditor
                  {...editorProps}
                  title="Новый язык"
                  initial={{
                    languageCode: nextLanguage,
                    sortOrder: variants.length + 1,
                    segments: [],
                    enabled: true,
                  }}
                />
              </>
            ) : null}
          </Paper>
        ) : null}

        {editing?.kind !== 'new' ? (
          <Button
            w="fit-content"
            variant="light"
            leftSection={<IconPlus size={16} />}
            disabled={editing !== null}
            onClick={() => setEditing({ kind: 'new' })}
          >
            Добавить язык
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert color="danger" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      ) : null}
    </Stack>
  )
}
