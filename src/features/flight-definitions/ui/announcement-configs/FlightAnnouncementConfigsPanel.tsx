import { useState } from 'react'

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconPlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'

import { ApiClientError } from '@/shared/api/apiClient'

import {
  useAddAnnouncementVariant,
  useAudioAssets,
  useCreateFlightAnnouncementConfig,
  useDeleteAnnouncementVariant,
  useFlightAnnouncementConfigs,
  useUpdateFlightAnnouncementConfig,
  useUpdateAnnouncementVariant,
  useUploadAudioAsset,
} from '../../hooks/useFlightDefinitions'
import type {
  AnnouncementVariant,
  AnnouncementVariantInput,
  AnnouncementVariantSourceType,
  FlightAnnouncementConfig,
  FlightAnnouncementType,
  FlightDefinition,
} from '../../model/types'

type Props = {
  flightDefinition: FlightDefinition
}

const typeLabels: Record<FlightAnnouncementType, string> = {
  check_in_opening: 'Начало регистрации',
  check_in_continuation: 'Продолжение регистрации',
  check_in_closing: 'Окончание регистрации',
  boarding_invitation: 'Приглашение на посадку',
  arrival: 'Прибытие рейса',
}

const sourceLabels: Record<AnnouncementVariantSourceType, string> = {
  text: 'Текст',
  audio_asset: 'Аудиофайл',
}

const validationErrorLabels: Record<string, string> = {
  configuration_disabled: 'Конфигурация выключена',
  announcement_type_incompatible_with_flight_direction:
    'Тип не соответствует направлению рейса',
  no_active_variants: 'Нет активных языковых вариантов',
}

function availableTypes(direction: FlightDefinition['direction']): FlightAnnouncementType[] {
  if (direction === 'arrival') return ['arrival']

  return [
    'check_in_opening',
    'check_in_continuation',
    'check_in_closing',
    'boarding_invitation',
  ]
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message

  return 'Не удалось сохранить настройки объявлений.'
}

export function FlightAnnouncementConfigsPanel({ flightDefinition }: Props) {
  const configsQuery = useFlightAnnouncementConfigs(flightDefinition.id)
  const createMutation = useCreateFlightAnnouncementConfig(flightDefinition.id)
  const [error, setError] = useState<string | null>(null)
  const existingTypes = new Set(
    (configsQuery.data ?? []).map((config) => config.announcementType),
  )
  const missingTypes = availableTypes(flightDefinition.direction).filter(
    (type) => !existingTypes.has(type),
  )

  async function createConfig(type: FlightAnnouncementType) {
    setError(null)
    try {
      await createMutation.mutateAsync({
        announcementType: type,
        enabled: true,
        repeatEveryMinutes: type === 'check_in_continuation' ? 6 : null,
      })
    } catch (mutationError) {
      setError(errorMessage(mutationError))
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={4}>Объявления рейса</Title>
        <Text c="dimmed" size="sm">
          Здесь админка описывает, что можно объявлять по этому рейсу. Диспетчерский
          клиент потом будет только выбирать действие и запускать подготовленный
          сценарий.
        </Text>
      </Stack>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />}>
          {error}
        </Alert>
      )}

      {missingTypes.length > 0 && (
        <Paper withBorder p="sm">
          <Group gap="xs">
            {missingTypes.map((type) => (
              <Button
                key={type}
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                loading={createMutation.isPending}
                onClick={() => void createConfig(type)}
              >
                {typeLabels[type]}
              </Button>
            ))}
          </Group>
        </Paper>
      )}

      {configsQuery.isLoading ? (
        <Text c="dimmed" size="sm">
          Загружаю объявления…
        </Text>
      ) : (configsQuery.data ?? []).length === 0 ? (
        <Text c="dimmed" size="sm">
          Для этого рейса пока нет настроенных объявлений.
        </Text>
      ) : (
        <Stack>
          {(configsQuery.data ?? []).map((config) => (
            <AnnouncementConfigCard
              key={config.id}
              config={config}
              flightDefinitionId={flightDefinition.id}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function AnnouncementConfigCard({
  config,
  flightDefinitionId,
}: {
  config: FlightAnnouncementConfig
  flightDefinitionId: string
}) {
  const updateConfigMutation = useUpdateFlightAnnouncementConfig(flightDefinitionId)
  const addVariantMutation = useAddAnnouncementVariant(flightDefinitionId)
  const deleteVariantMutation = useDeleteAnnouncementVariant(flightDefinitionId)
  const audioAssets = useAudioAssets()
  const [enabled, setEnabled] = useState(config.enabled)
  const [repeatEveryMinutes, setRepeatEveryMinutes] = useState<number | null>(
    config.repeatEveryMinutes,
  )
  const [variant, setVariant] = useState<AnnouncementVariantInput>({
    languageCode: 'ro-MD',
    sortOrder: config.variants.length + 1,
    sourceType: 'text',
    audioAssetId: null,
    text: '',
    enabled: true,
  })
  const [error, setError] = useState<string | null>(null)

  async function saveSettings() {
    setError(null)
    try {
      await updateConfigMutation.mutateAsync({
        configId: config.id,
        input: {
          enabled,
          repeatEveryMinutes:
            config.announcementType === 'check_in_continuation'
              ? repeatEveryMinutes
              : null,
        },
      })
    } catch (mutationError) {
      setError(errorMessage(mutationError))
    }
  }

  async function addVariant() {
    setError(null)
    try {
      await addVariantMutation.mutateAsync({
        configId: config.id,
        input: {
          ...variant,
          languageCode: variant.languageCode.trim(),
          audioAssetId:
            variant.sourceType === 'audio_asset'
              ? variant.audioAssetId?.trim() || null
              : null,
          text: variant.sourceType === 'text' ? variant.text?.trim() || null : null,
        },
      })
      setVariant({
        languageCode: 'ro-MD',
        sortOrder: config.variants.length + 2,
        sourceType: 'text',
        audioAssetId: null,
        text: '',
        enabled: true,
      })
    } catch (mutationError) {
      setError(errorMessage(mutationError))
    }
  }

  return (
    <Card withBorder>
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Group gap="xs">
              <Title order={5}>{typeLabels[config.announcementType]}</Title>
              <Badge color={config.enabled ? 'green' : 'gray'}>
                {config.enabled ? 'активно' : 'выключено'}
              </Badge>
              <Badge
                color={config.isValidForDispatcher ? 'teal' : 'yellow'}
                leftSection={
                  config.isValidForDispatcher ? <IconCheck size={12} /> : undefined
                }
              >
                {config.isValidForDispatcher
                  ? 'готово для диспетчера'
                  : 'требует настройки'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {config.variants.length} вариант(ов): звук или текст, по языкам
            </Text>
          </Stack>
          <Switch
            label="Включено"
            checked={enabled}
            onChange={(event) => setEnabled(event.currentTarget.checked)}
          />
        </Group>

        {!config.isValidForDispatcher && (
          <Alert color="yellow" title="Конфигурация пока недоступна диспетчеру">
            {config.validationErrors
              .map((item) => validationErrorLabels[item] ?? item)
              .join('. ')}
          </Alert>
        )}

        {config.announcementType === 'check_in_continuation' && (
          <NumberInput
            label="Повторять каждые, минут"
            min={1}
            max={120}
            value={repeatEveryMinutes ?? undefined}
            onChange={(value) =>
              setRepeatEveryMinutes(typeof value === 'number' ? value : null)
            }
          />
        )}

        <Group justify="flex-end">
          <Button
            size="xs"
            variant="light"
            loading={updateConfigMutation.isPending}
            onClick={() => void saveSettings()}
          >
            Сохранить настройки
          </Button>
        </Group>

        {config.variants.map((item) => (
          <VariantEditor
            key={item.id}
            item={item}
            configId={config.id}
            flightDefinitionId={flightDefinitionId}
            audioAssetOptions={(audioAssets.data ?? []).map((asset) => ({
              value: asset.id,
              label: `${asset.name} · ${asset.languageCode}`,
            }))}
            deleting={deleteVariantMutation.isPending}
            onDelete={() =>
              deleteVariantMutation.mutateAsync({
                configId: config.id,
                variantId: item.id,
              })
            }
          />
        ))}

        <Paper withBorder p="sm">
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Добавить вариант
            </Text>
            <Group grow align="flex-end">
              <TextInput
                label="Язык"
                value={variant.languageCode}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setVariant((current) => ({
                    ...current,
                    languageCode: value,
                  }))
                }}
              />
              <NumberInput
                label="Порядок"
                min={1}
                value={variant.sortOrder}
                onChange={(value) =>
                  setVariant((current) => ({
                    ...current,
                    sortOrder: typeof value === 'number' ? value : 1,
                  }))
                }
              />
              <Select
                label="Источник"
                allowDeselect={false}
                data={[
                  { value: 'text', label: 'Текст' },
                  { value: 'audio_asset', label: 'Аудиофайл' },
                ]}
                value={variant.sourceType}
                onChange={(value) =>
                  setVariant((current) => ({
                    ...current,
                    sourceType: (value ?? 'text') as AnnouncementVariantSourceType,
                  }))
                }
              />
            </Group>

            {variant.sourceType === 'audio_asset' ? (
              <Stack gap="xs">
                <Select
                  label="Аудиофайл"
                  placeholder={
                    audioAssets.isLoading
                      ? 'Загрузка аудиофайлов…'
                      : 'Выберите загруженный файл'
                  }
                  searchable
                  data={(audioAssets.data ?? []).map((asset) => ({
                    value: asset.id,
                    label: `${asset.name} · ${asset.languageCode}`,
                  }))}
                  value={variant.audioAssetId ?? ''}
                  onChange={(value) =>
                    setVariant((current) => ({
                      ...current,
                      audioAssetId: value,
                    }))
                  }
                />
                <AudioAssetUploader
                  languageCode={variant.languageCode}
                  onUploaded={(audioAssetId) =>
                    setVariant((current) => ({
                      ...current,
                      audioAssetId,
                    }))
                  }
                />
              </Stack>
            ) : (
              <Textarea
                label="Текст объявления"
                minRows={3}
                value={variant.text ?? ''}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setVariant((current) => ({
                    ...current,
                    text: value,
                  }))
                }}
              />
            )}

            <Group justify="space-between">
              <Checkbox
                label="Вариант включён"
                checked={variant.enabled}
                onChange={(event) => {
                  const checked = event.currentTarget.checked
                  setVariant((current) => ({
                    ...current,
                    enabled: checked,
                  }))
                }}
              />
              <Button
                size="xs"
                loading={addVariantMutation.isPending}
                disabled={
                  !variant.languageCode.trim() ||
                  (variant.sourceType === 'text'
                    ? !variant.text?.trim()
                    : !variant.audioAssetId)
                }
                onClick={() => void addVariant()}
              >
                Добавить вариант
              </Button>
            </Group>
          </Stack>
        </Paper>

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}
      </Stack>
    </Card>
  )
}

function VariantEditor({
  item,
  configId,
  flightDefinitionId,
  audioAssetOptions,
  deleting,
  onDelete,
}: {
  item: AnnouncementVariant
  configId: string
  flightDefinitionId: string
  audioAssetOptions: Array<{ value: string; label: string }>
  deleting: boolean
  onDelete: () => Promise<unknown>
}) {
  const updateMutation = useUpdateAnnouncementVariant(flightDefinitionId)
  const [draft, setDraft] = useState<AnnouncementVariantInput>({
    languageCode: item.languageCode,
    sortOrder: item.sortOrder,
    sourceType: item.sourceType,
    audioAssetId: item.audioAssetId,
    text: item.text,
    enabled: item.enabled,
  })
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    try {
      await updateMutation.mutateAsync({
        configId,
        variantId: item.id,
        input: {
          ...draft,
          languageCode: draft.languageCode.trim(),
          audioAssetId:
            draft.sourceType === 'audio_asset' ? draft.audioAssetId : null,
          text: draft.sourceType === 'text' ? draft.text?.trim() || null : null,
        },
      })
    } catch (mutationError) {
      setError(errorMessage(mutationError))
    }
  }

  return (
    <Paper withBorder p="sm">
      <Stack gap="sm">
        <Group grow align="flex-end">
          <TextInput
            label="Язык"
            value={draft.languageCode}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft((current) => ({
                ...current,
                languageCode: value,
              }))
            }}
          />
          <NumberInput
            label="Порядок"
            min={1}
            value={draft.sortOrder}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                sortOrder: typeof value === 'number' ? value : 1,
              }))
            }
          />
          <Select
            label="Источник"
            allowDeselect={false}
            data={[
              { value: 'text', label: sourceLabels.text },
              { value: 'audio_asset', label: sourceLabels.audio_asset },
            ]}
            value={draft.sourceType}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                sourceType: (value ?? 'text') as AnnouncementVariantSourceType,
              }))
            }
          />
        </Group>

        {draft.sourceType === 'audio_asset' ? (
          <Stack gap="xs">
            <Select
              label="Аудиофайл"
              searchable
              data={audioAssetOptions}
              value={draft.audioAssetId}
              onChange={(value) =>
                setDraft((current) => ({ ...current, audioAssetId: value }))
              }
            />
            <AudioAssetUploader
              languageCode={draft.languageCode}
              onUploaded={(audioAssetId) =>
                setDraft((current) => ({ ...current, audioAssetId }))
              }
            />
          </Stack>
        ) : (
          <Textarea
            label="Текст объявления"
            minRows={2}
            value={draft.text ?? ''}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft((current) => ({
                ...current,
                text: value,
              }))
            }}
          />
        )}

        <Group justify="space-between">
          <Switch
            label="Вариант включён"
            checked={draft.enabled}
            onChange={(event) => {
              const checked = event.currentTarget.checked
              setDraft((current) => ({
                ...current,
                enabled: checked,
              }))
            }}
          />
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              loading={updateMutation.isPending}
              onClick={() => void save()}
            >
              Сохранить вариант
            </Button>
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={14} />}
              loading={deleting}
              onClick={() => void onDelete()}
            >
              Удалить
            </Button>
          </Group>
        </Group>

        {error && <Alert color="red">{error}</Alert>}
      </Stack>
    </Paper>
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
      setError(errorMessage(uploadError))
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
      {error && <Alert color="red">{error}</Alert>}
    </Stack>
  )
}
