import { useMemo, useState } from 'react'

import { Alert, Button, Group, Modal, Select, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'

import type { AnnouncementPreset, OperationalResource } from '../model/types'
import { OperationalResourceButtonPicker } from './OperationalResourceButtonPicker'

export type PresetLaunchVariables = { templateId: string; languages: string[] }

type LaunchMutation = {
  mutate: (
    variables: PresetLaunchVariables,
    options?: { onSuccess?: () => void },
  ) => void
  reset: () => void
  isPending: boolean
  isError: boolean
  error?: unknown
}

type Props = {
  opened: boolean
  onClose: () => void
  title: string
  /** Wording of the primary button; an emergency launch deserves its own verb. */
  submitLabel?: string
  submitColor?: string
  emptyHint: string
  presets: AnnouncementPreset[]
  presetsLoading: boolean
  launch: LaunchMutation
  errorTitle: string
  /** Optional warning shown above the form, e.g. what an emergency launch does. */
  notice?: string
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const violations = error.violations
      ? Object.values(error.violations).flat()
      : []

    return violations.length > 0 ? violations.join('. ') : error.message
  }

  return 'Не удалось запустить объявление. Повторите попытку.'
}

/**
 * Launch an airport-wide announcement from a preset: pick one preset and, by
 * default, all of its configured languages (the dispatcher may narrow the subset).
 *
 * Shared by the supplementary (task 024) and emergency (task 026) launches — the two
 * differ in what the server does with the announcement, not in how it is chosen, so
 * the screen is one component parameterised by wording and by the mutation it calls.
 * Server 404/422 (missing or inactive preset, unavailable asset) surface in the form.
 */
export function PresetAnnouncementModal({
  opened,
  onClose,
  title,
  submitLabel = 'Запустить',
  submitColor,
  emptyHint,
  presets,
  presetsLoading,
  launch,
  errorTitle,
  notice,
}: Props) {
  const languagesQuery = useLanguages()

  const [templateId, setTemplateId] = useState<string | null>(null)
  // `null` means "use the default selection" (all of the preset's languages); once
  // the dispatcher edits the picker we keep their explicit choice. Selecting another
  // preset resets it, so the default follows the chosen preset.
  const [languageOverride, setLanguageOverride] = useState<string[] | null>(null)

  const selectedPreset = presets.find((preset) => preset.id === templateId) ?? null

  const languages = languageOverride ?? selectedPreset?.languageCodes ?? []

  const handleTemplateChange = (next: string | null) => {
    setTemplateId(next)
    setLanguageOverride(null)
  }

  const languageNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const language of languagesQuery.data ?? []) {
      names.set(language.code, language.name)
    }

    return names
  }, [languagesQuery.data])

  const languageResources: OperationalResource[] = (
    selectedPreset?.languageCodes ?? []
  ).map((code, index) => ({
    id: code,
    code: code.toUpperCase(),
    displayName: languageNames.get(code) ?? code,
    sortOrder: index,
    active: true,
  }))

  const canLaunch = selectedPreset !== null && languages.length > 0

  const handleClose = () => {
    setTemplateId(null)
    setLanguageOverride(null)
    launch.reset()
    onClose()
  }

  const handleLaunch = () => {
    if (!templateId) return

    launch.mutate({ templateId, languages }, { onSuccess: handleClose })
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <Stack gap="md">
        {notice ? (
          <Alert color="danger" icon={<IconAlertCircle size={16} />}>
            {notice}
          </Alert>
        ) : null}

        {presets.length === 0 && !presetsLoading ? (
          <Text c="dimmed" size="sm">
            {emptyHint}
          </Text>
        ) : (
          <>
            <Select
              label="Объявление"
              placeholder="Выберите объявление"
              data={presets.map((preset) => ({
                value: preset.id,
                label: preset.name,
              }))}
              value={templateId}
              onChange={handleTemplateChange}
              disabled={presetsLoading}
              required
              searchable
            />

            {selectedPreset ? (
              <OperationalResourceButtonPicker
                emptyMessage="У объявления нет языков"
                label="Языки объявления"
                multiple
                onChange={setLanguageOverride}
                required
                resources={languageResources}
                value={languages}
              />
            ) : null}
          </>
        )}

        {launch.isError && (
          <Alert color="danger" icon={<IconAlertCircle size={16} />} title={errorTitle}>
            {errorMessage(launch.error)}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleLaunch}
            loading={launch.isPending}
            disabled={!canLaunch}
            color={submitColor}
          >
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
