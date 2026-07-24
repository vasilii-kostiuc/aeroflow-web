import { useMemo, useState } from 'react'

import { Alert, Button, Group, Modal, Select, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'

import type { OperationalResource } from '../model/types'
import {
  useLaunchSupplementaryAnnouncement,
  useSupplementaryTemplates,
} from '../hooks/useLaunchSupplementaryAnnouncement'
import { OperationalResourceButtonPicker } from './OperationalResourceButtonPicker'

type Props = {
  opened: boolean
  onClose: () => void
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
 * Launch an airport-wide supplementary announcement (task 024) from a preset — the
 * heir of the legacy САО "Дополнительно" set. The dispatcher picks one preset and,
 * by default, all of its configured languages (may narrow the subset). Not tied to a
 * flight; the server queues the preset audio at priority 50. Server 404/422 (missing
 * or inactive preset, unavailable asset) surface in the form.
 */
export function SupplementaryAnnouncementModal({ opened, onClose }: Props) {
  const templatesQuery = useSupplementaryTemplates(opened)
  const languagesQuery = useLanguages()
  const launch = useLaunchSupplementaryAnnouncement()

  const [templateId, setTemplateId] = useState<string | null>(null)
  // `null` means "use the default selection" (all of the preset's languages); once
  // the dispatcher edits the picker we keep their explicit choice. Selecting another
  // preset resets it, so the default follows the chosen preset.
  const [languageOverride, setLanguageOverride] = useState<string[] | null>(null)

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data])
  const selectedTemplate =
    templates.find((template) => template.id === templateId) ?? null

  const languages = languageOverride ?? selectedTemplate?.languageCodes ?? []

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
    selectedTemplate?.languageCodes ?? []
  ).map((code, index) => ({
    id: code,
    code: code.toUpperCase(),
    displayName: languageNames.get(code) ?? code,
    sortOrder: index,
    active: true,
  }))

  const canLaunch = selectedTemplate !== null && languages.length > 0

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
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Дополнительное объявление"
    >
      <Stack gap="md">
        {templates.length === 0 && !templatesQuery.isLoading ? (
          <Text c="dimmed" size="sm">
            Нет настроенных дополнительных объявлений. Добавьте их в разделе
            администрирования.
          </Text>
        ) : (
          <>
            <Select
              label="Объявление"
              placeholder="Выберите объявление"
              data={templates.map((template) => ({
                value: template.id,
                label: template.name,
              }))}
              value={templateId}
              onChange={handleTemplateChange}
              disabled={templatesQuery.isLoading}
              required
              searchable
            />

            {selectedTemplate ? (
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
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            title="Объявление не запущено"
          >
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
          >
            Запустить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
