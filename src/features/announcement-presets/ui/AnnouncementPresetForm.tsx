import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconMicrophone, IconPlus, IconTrash } from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'
import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import type {
  AnnouncementPreset,
  AnnouncementPresetInput,
  AudioAsset,
  AudioAssetsQuery,
  GenerateAudioAssetMutation,
} from '../model/types'

type Props = {
  preset: AnnouncementPreset | null
  onClose: () => void
  title: string
  namePlaceholder: string
  assets: AudioAssetsQuery
  generate: GenerateAudioAssetMutation
  submit: (input: AnnouncementPresetInput) => Promise<unknown>
  pending: boolean
}

type FormVariant = { languageCode: string; audioAssetId: string; text: string }
type FormValues = { name: string; variants: FormVariant[] }

/**
 * Editor of an announcement preset: a name plus one row per language, each pointing
 * at an audio asset that is either picked from the uploaded/generated catalog or
 * voiced on the spot through TTS (task 021).
 *
 * Purely presentational and shared by the supplementary (024) and emergency (026)
 * catalogs — the owning feature passes in its own queries and mutation, so this
 * component never knows which catalog it edits.
 */
export function AnnouncementPresetForm({
  preset,
  onClose,
  title,
  namePlaceholder,
  assets,
  generate,
  submit,
  pending,
}: Props) {
  const languagesQuery = useLanguages()
  const [error, setError] = useState<string | null>(null)
  // Index of the variant currently being voiced, to scope the button spinner.
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  // Freshly generated assets, kept locally so the picker shows them immediately
  // (before the assets query refetch lands).
  const [generatedAssets, setGeneratedAssets] = useState<AudioAsset[]>([])

  const form = useForm<FormValues>({
    initialValues: preset
      ? {
          name: preset.name,
          variants: preset.variants.map((variant) => ({ ...variant, text: '' })),
        }
      : { name: '', variants: [{ languageCode: '', audioAssetId: '', text: '' }] },
    validate: {
      name: (value) => (value.trim() ? null : 'Введите название'),
      variants: {
        languageCode: (value) => (value ? null : 'Выберите язык'),
        audioAssetId: (value) => (value ? null : 'Выберите или озвучьте аудио'),
      },
    },
  })

  const languageOptions = (languagesQuery.data ?? []).map((language) => ({
    value: language.code,
    label: `${language.name} (${language.code})`,
  }))

  const assetOptions = [...(assets.data ?? []), ...generatedAssets]
    .filter((asset) => asset.active)
    .filter(
      (asset, index, all) => all.findIndex((other) => other.id === asset.id) === index,
    )
    .map((asset) => ({
      value: asset.id,
      label: `${asset.name} (${asset.languageCode})`,
    }))

  async function voice(index: number) {
    const variant = form.values.variants[index]
    if (!variant.languageCode) {
      setError('Сначала выберите язык варианта, чтобы озвучить текст.')

      return
    }
    const text = variant.text.trim()
    if (!text) return

    setError(null)
    setGeneratingIndex(index)
    try {
      const asset = await generate.mutateAsync({
        text,
        languageCode: variant.languageCode,
      })
      setGeneratedAssets((current) =>
        current.some((existing) => existing.id === asset.id)
          ? current
          : [...current, asset],
      )
      form.setFieldValue(`variants.${index}.audioAssetId`, asset.id)
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 502
          ? 'Сервис синтеза речи недоступен. Повторите позже.'
          : caught instanceof Error
            ? caught.message
            : 'Не удалось озвучить текст.',
      )
    } finally {
      setGeneratingIndex(null)
    }
  }

  async function handleSubmit(values: FormValues) {
    setError(null)

    const languages = values.variants.map((variant) => variant.languageCode)
    if (new Set(languages).size !== languages.length) {
      setError('Языки вариантов не должны повторяться.')

      return
    }

    const input: AnnouncementPresetInput = {
      name: values.name.trim(),
      variants: values.variants.map(({ languageCode, audioAssetId }) => ({
        languageCode,
        audioAssetId,
      })),
    }

    try {
      await submit(input)
      onClose()
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.violations) {
        form.setErrors(caught.violations)
      }
      setError(
        caught instanceof Error ? caught.message : 'Не удалось сохранить объявление.',
      )
    }
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={title}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}

          <TextInput
            label="Название"
            placeholder={namePlaceholder}
            required
            {...form.getInputProps('name')}
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Языковые варианты
            </Text>
            <Stack gap="sm">
              {form.values.variants.map((_, index) => (
                <Paper key={index} withBorder p="sm" radius="md">
                  <Stack gap="xs">
                    <Group align="flex-start" wrap="nowrap">
                      <Select
                        aria-label={`Язык варианта ${index + 1}`}
                        placeholder="Язык"
                        data={languageOptions}
                        disabled={languagesQuery.isLoading}
                        style={{ flex: 1 }}
                        {...form.getInputProps(`variants.${index}.languageCode`)}
                      />
                      <Select
                        aria-label={`Аудио варианта ${index + 1}`}
                        placeholder="Аудиофайл"
                        data={assetOptions}
                        disabled={assets.isLoading}
                        style={{ flex: 2 }}
                        {...form.getInputProps(`variants.${index}.audioAssetId`)}
                      />
                      <div style={{ marginTop: 4 }}>
                        <AudioPreviewButton
                          audioAssetId={form.values.variants[index].audioAssetId}
                        />
                      </div>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        mt={4}
                        aria-label={`Удалить вариант ${index + 1}`}
                        disabled={form.values.variants.length === 1}
                        onClick={() => form.removeListItem('variants', index)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                    <Group align="flex-end" wrap="nowrap" gap="xs">
                      <Textarea
                        aria-label={`Текст для озвучивания варианта ${index + 1}`}
                        placeholder="…или впишите текст и озвучьте его"
                        rows={3}
                        style={{ flex: 1 }}
                        {...form.getInputProps(`variants.${index}.text`)}
                      />
                      <Button
                        variant="light"
                        leftSection={<IconMicrophone size={16} />}
                        loading={generatingIndex === index}
                        disabled={!form.values.variants[index].text.trim()}
                        onClick={() => voice(index)}
                      >
                        Озвучить
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </Stack>
            <Button
              variant="subtle"
              size="compact-sm"
              mt="xs"
              leftSection={<IconPlus size={16} />}
              onClick={() =>
                form.insertListItem('variants', {
                  languageCode: '',
                  audioAssetId: '',
                  text: '',
                })
              }
            >
              Добавить язык
            </Button>
          </div>

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={pending}>
              Отмена
            </Button>
            <Button type="submit" loading={pending}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
