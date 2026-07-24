import { useMemo, useState } from 'react'

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import type { Language } from '@/features/languages/model/types'
import { ApiClientError } from '@/shared/api/apiClient'
import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import {
  useAddAnnouncementVariant,
  useAudioAssets,
  useCreateFlightAnnouncementConfig,
  useDeleteAnnouncementVariant,
  useFlightAnnouncementConfigs,
  useUpdateAnnouncementVariant,
  useUpdateFlightAnnouncementConfig,
  useUploadAudioAsset,
} from '../../hooks/useFlightDefinitions'
import type {
  AnnouncementTemplateSegmentInput,
  AnnouncementTemplateSegmentType,
  AnnouncementVariant,
  AnnouncementVariantInput,
  AudioAsset,
  DynamicSlotType,
  FlightAnnouncementConfig,
  FlightAnnouncementType,
  FlightDefinition,
} from '../../model/types'

type Props = {
  flightDefinition: FlightDefinition
}

type SegmentModalState = {
  index: number | null
  segment: AnnouncementTemplateSegmentInput
}

const typeLabels: Record<FlightAnnouncementType, string> = {
  check_in_opening: 'Начало регистрации',
  check_in_continuation: 'Продолжение регистрации',
  check_in_closing: 'Окончание регистрации',
  boarding_invitation: 'Приглашение на посадку',
  arrival: 'Прибытие рейса',
}

const segmentTypeLabels: Record<AnnouncementTemplateSegmentType, string> = {
  audio_asset: 'Аудиофайл',
  dynamic_slot: 'Динамическое поле',
  pause: 'Пауза',
  text: 'Текст',
}

const slotLabels: Record<DynamicSlotType, string> = {
  check_in_counters: 'Стойки регистрации',
  gate_code: 'Выход',
}

const validationErrorLabels: Record<string, string> = {
  configuration_disabled: 'Конфигурация выключена',
  announcement_type_incompatible_with_flight_direction:
    'Тип не соответствует направлению рейса',
  no_active_variants: 'Нет активных языковых вариантов',
  text_segment_requires_tts: 'Текстовый сегмент требует TTS',
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

function availableSlots(type: FlightAnnouncementType): DynamicSlotType[] {
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

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message

  return 'Не удалось сохранить настройки объявлений.'
}

function languageOptions(languages: Language[], currentCode?: string) {
  const options = languages.map((language) => ({
    value: language.code,
    label:
      language.nativeName === language.name
        ? language.code
        : `${language.nativeName} · ${language.code}`,
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

function firstActiveLanguage(languages: Language[]): string {
  return languages.find((language) => language.active)?.code ?? ''
}

function createSegment(
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

function defaultVariant(languageCode: string, sortOrder: number): AnnouncementVariantInput {
  return {
    languageCode,
    sortOrder,
    segments: [],
    enabled: true,
  }
}

function reindexSegments(
  segments: AnnouncementTemplateSegmentInput[],
): AnnouncementTemplateSegmentInput[] {
  return segments.map((segment, index) => ({ ...segment, sortOrder: index + 1 }))
}

function normalizeVariant(input: AnnouncementVariantInput): AnnouncementVariantInput {
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

function canSaveSegment(segment: AnnouncementTemplateSegmentInput): boolean {
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

function canSaveVariant(input: AnnouncementVariantInput): boolean {
  return (
    Boolean(input.languageCode.trim()) &&
    input.segments.length > 0 &&
    input.segments.every(canSaveSegment)
  )
}

function variantSaveHint(input: AnnouncementVariantInput): string | null {
  if (!input.languageCode.trim()) return 'Выберите язык варианта.'
  if (input.segments.length === 0) return 'Добавьте хотя бы один сегмент.'
  if (!input.segments.every(canSaveSegment)) {
    return 'Заполните обязательные поля во всех сегментах.'
  }

  return null
}

function segmentTypeOptions(announcementType: FlightAnnouncementType) {
  const slots = availableSlots(announcementType)

  return (Object.keys(segmentTypeLabels) as AnnouncementTemplateSegmentType[])
    .filter((type) => type !== 'dynamic_slot' || slots.length > 0)
    .map((type) => ({
      value: type,
      label: segmentTypeLabels[type],
    }))
}

export function FlightAnnouncementConfigsPanel({ flightDefinition }: Props) {
  const configsQuery = useFlightAnnouncementConfigs(flightDefinition.id)
  const createMutation = useCreateFlightAnnouncementConfig(flightDefinition.id)
  const [activeType, setActiveType] = useState<FlightAnnouncementType>(
    availableTypes(flightDefinition.direction)[0],
  )
  const [error, setError] = useState<string | null>(null)
  const availableAnnouncementTypes = availableTypes(flightDefinition.direction)
  const configs = configsQuery.data ?? []
  const configByType = new Map(
    configs.map((config) => [config.announcementType, config]),
  )

  async function createConfig(type: FlightAnnouncementType) {
    setError(null)
    try {
      await createMutation.mutateAsync({
        announcementType: type,
        enabled: true,
        repeatEveryMinutes: type === 'check_in_continuation' ? 6 : null,
      })
      setActiveType(type)
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

      {configsQuery.isLoading ? (
        <Text c="dimmed" size="sm">
          Загружаю объявления...
        </Text>
      ) : (
        <Tabs
          value={activeType}
          keepMounted={false}
          onChange={(value) => {
            if (value) setActiveType(value as FlightAnnouncementType)
          }}
        >
          <Tabs.List>
            {availableAnnouncementTypes.map((type) => (
              <Tabs.Tab key={type} value={type}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm">{typeLabels[type]}</Text>
                  <ConfigStatusBadge config={configByType.get(type)} />
                </Group>
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {availableAnnouncementTypes.map((type) => {
            const config = configByType.get(type)

            return (
              <Tabs.Panel key={type} value={type} pt="md">
                {config ? (
                  <AnnouncementConfigCard
                    config={config}
                    flightDefinitionId={flightDefinition.id}
                  />
                ) : (
                  <MissingConfigPanel
                    type={type}
                    creating={createMutation.isPending}
                    onCreate={() => void createConfig(type)}
                  />
                )}
              </Tabs.Panel>
            )
          })}
        </Tabs>
      )}
    </Stack>
  )
}

function ConfigStatusBadge({ config }: { config?: FlightAnnouncementConfig }) {
  if (!config) {
    return <Badge color="gray">не создано</Badge>
  }

  if (!config.enabled) {
    return <Badge color="gray">выключено</Badge>
  }

  return (
    <Badge color={config.isValidForDispatcher ? 'teal' : 'yellow'}>
      {config.isValidForDispatcher ? 'готово' : 'настроить'}
    </Badge>
  )
}

function MissingConfigPanel({
  type,
  creating,
  onCreate,
}: {
  type: FlightAnnouncementType
  creating: boolean
  onCreate: () => void
}) {
  return (
    <Paper withBorder p="lg">
      <Stack gap="sm">
        <Text fw={600}>{typeLabels[type]}</Text>
        <Text c="dimmed" size="sm">
          Настройка для этого типа объявления ещё не создана.
        </Text>
        <Button
          w="fit-content"
          leftSection={<IconPlus size={16} />}
          loading={creating}
          onClick={onCreate}
        >
          Создать настройку
        </Button>
      </Stack>
    </Paper>
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
  const languages = useLanguages()
  const initialLanguage = firstActiveLanguage(languages.data ?? [])
  const [enabled, setEnabled] = useState(config.enabled)
  const [repeatEveryMinutes, setRepeatEveryMinutes] = useState<number | null>(
    config.repeatEveryMinutes,
  )
  const [variant, setVariant] = useState<AnnouncementVariantInput>(
    defaultVariant('', config.variants.length + 1),
  )
  const [addingVariant, setAddingVariant] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const effectiveVariant = {
    ...variant,
    languageCode: variant.languageCode || initialLanguage,
  }
  const variantHint = variantSaveHint(effectiveVariant)

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
        input: normalizeVariant(effectiveVariant),
      })
      setVariant(defaultVariant(initialLanguage, config.variants.length + 2))
      setAddingVariant(false)
    } catch (mutationError) {
      setError(errorMessage(mutationError))
    }
  }

  function startVariantDraft() {
    setVariant(defaultVariant(initialLanguage, config.variants.length + 1))
    setAddingVariant(true)
  }

  function cancelVariantDraft() {
    setVariant(defaultVariant(initialLanguage, config.variants.length + 1))
    setAddingVariant(false)
  }

  return (
    <Stack gap="md">
      <Card withBorder>
        <Stack>
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Group gap="xs">
                <Title order={5}>{typeLabels[config.announcementType]}</Title>
                <Badge color={enabled ? 'green' : 'gray'}>
                  {enabled ? 'активно' : 'выключено'}
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
                {config.variants.length} вариант(ов): упорядоченные сегменты по языкам
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
        </Stack>
      </Card>

      <Stack gap="sm">
        <Text fw={600}>Языковые варианты</Text>
        {config.variants.map((item) => (
          <VariantEditor
            key={item.id}
            item={item}
            config={config}
            flightDefinitionId={flightDefinitionId}
            audioAssets={audioAssets.data ?? []}
            languages={languages.data ?? []}
            languagesLoading={languages.isLoading}
            deleting={deleteVariantMutation.isPending}
            onDelete={() =>
              deleteVariantMutation.mutateAsync({
                configId: config.id,
                variantId: item.id,
              })
            }
          />
        ))}
      </Stack>

      {addingVariant ? (
        <Paper withBorder p="sm">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Group gap="xs">
                  <Text fw={600}>{effectiveVariant.languageCode || 'Новый язык'}</Text>
                  <Badge color={variant.enabled ? 'green' : 'gray'} variant="light">
                    {variant.enabled ? 'включён' : 'выключен'}
                  </Badge>
                  <Badge variant="light">{variant.segments.length} сегм.</Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  Новый языковой вариант
                </Text>
              </Stack>
              <Group gap="xs" justify="flex-end">
                <Switch
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
                  variant="light"
                  loading={addVariantMutation.isPending}
                  disabled={!canSaveVariant(effectiveVariant)}
                  onClick={() => void addVariant()}
                >
                  Сохранить вариант
                </Button>
                <Button size="xs" variant="default" onClick={cancelVariantDraft}>
                  Отмена
                </Button>
              </Group>
            </Group>

            <Group grow align="flex-end">
              <LanguageSelect
                value={effectiveVariant.languageCode}
                languages={languages.data ?? []}
                loading={languages.isLoading}
                onChange={(languageCode) =>
                  setVariant((current) => ({ ...current, languageCode }))
                }
              />
              <NumberInput
                label="Порядок языка"
                min={1}
                value={variant.sortOrder}
                onChange={(value) =>
                  setVariant((current) => ({
                    ...current,
                    sortOrder: typeof value === 'number' ? value : 1,
                  }))
                }
              />
            </Group>

            <SegmentList
              announcementType={config.announcementType}
              languageCode={effectiveVariant.languageCode}
              ariaContext="нового варианта"
              segments={variant.segments}
              audioAssets={audioAssets.data ?? []}
              onChange={(segments) =>
                setVariant((current) => ({ ...current, segments }))
              }
            />

            {variantHint && (
              <Text size="xs" c="dimmed">
                {variantHint}
              </Text>
            )}
          </Stack>
        </Paper>
      ) : (
        <Button
          w="fit-content"
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={startVariantDraft}
        >
          Добавить вариант
        </Button>
      )}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />}>
          {error}
        </Alert>
      )}
    </Stack>
  )
}

function LanguageSelect({
  value,
  languages,
  loading,
  onChange,
}: {
  value: string
  languages: Language[]
  loading: boolean
  onChange: (languageCode: string) => void
}) {
  return (
    <Select
      label="Язык"
      placeholder={loading ? 'Загрузка языков...' : 'Выберите язык'}
      searchable
      allowDeselect={false}
      disabled={loading}
      data={languageOptions(languages, value)}
      value={value || null}
      onChange={(next) => onChange(next ?? '')}
    />
  )
}

function VariantEditor({
  item,
  config,
  flightDefinitionId,
  audioAssets,
  languages,
  languagesLoading,
  deleting,
  onDelete,
}: {
  item: AnnouncementVariant
  config: FlightAnnouncementConfig
  flightDefinitionId: string
  audioAssets: AudioAsset[]
  languages: Language[]
  languagesLoading: boolean
  deleting: boolean
  onDelete: () => Promise<unknown>
}) {
  const updateMutation = useUpdateAnnouncementVariant(flightDefinitionId)
  const [draft, setDraft] = useState<AnnouncementVariantInput>({
    languageCode: item.languageCode,
    sortOrder: item.sortOrder,
    segments: reindexSegments(
      [...item.segments]
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
    enabled: item.enabled,
  })
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    try {
      await updateMutation.mutateAsync({
        configId: config.id,
        variantId: item.id,
        input: normalizeVariant(draft),
      })
    } catch (mutationError) {
      setError(errorMessage(mutationError))
    }
  }

  return (
    <Paper withBorder p="sm">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={600}>{draft.languageCode}</Text>
              <Badge color={draft.enabled ? 'green' : 'gray'} variant="light">
                {draft.enabled ? 'включён' : 'выключен'}
              </Badge>
              <Badge variant="light">{draft.segments.length} сегм.</Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Порядок языка: {draft.sortOrder}
            </Text>
          </Stack>
          <Group gap="xs" justify="flex-end">
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
            <Button
              size="xs"
              variant="light"
              loading={updateMutation.isPending}
              disabled={!canSaveVariant(draft)}
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
              Удалить вариант
            </Button>
          </Group>
        </Group>

        <Group grow align="flex-end">
          <LanguageSelect
            value={draft.languageCode}
            languages={languages}
            loading={languagesLoading}
            onChange={(languageCode) =>
              setDraft((current) => ({ ...current, languageCode }))
            }
          />
          <NumberInput
            label="Порядок языка"
            min={1}
            value={draft.sortOrder}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                sortOrder: typeof value === 'number' ? value : 1,
              }))
            }
          />
        </Group>

        <SegmentList
          announcementType={config.announcementType}
          languageCode={draft.languageCode}
          ariaContext={`варианта ${draft.languageCode}`}
          segments={draft.segments}
          audioAssets={audioAssets}
          onChange={(segments) => setDraft((current) => ({ ...current, segments }))}
        />

        {error && <Alert color="red">{error}</Alert>}
      </Stack>
    </Paper>
  )
}

function SegmentList({
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
                      color="red"
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
          audioAssets={audioAssets}
          onClose={() => setModal(null)}
          onSubmit={saveSegment}
        />
      )}
    </Stack>
  )
}

function SegmentModal({
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
            description="Без TTS такой вариант будет помечен как неготовый."
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

function segmentSummary(
  segment: AnnouncementTemplateSegmentInput,
  audioAssets: AudioAsset[],
): string {
  if (segment.type === 'audio_asset') {
    const asset = audioAssets.find((item) => item.id === segment.audioAssetId)
    return asset
      ? `${asset.name} · ${asset.languageCode}`
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
