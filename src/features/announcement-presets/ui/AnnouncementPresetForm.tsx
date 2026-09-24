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

import { useGenerateAudioAsset } from '@/features/audio-assets/hooks/useAudioAssets'
import { AudioAssetPicker } from '@/features/audio-assets/ui/AudioAssetPicker'
import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'

import type { AnnouncementPreset, AnnouncementPresetInput } from '../model/types'

type Props = {
  preset: AnnouncementPreset | null
  onClose: () => void
  title: string
  namePlaceholder: string
  /** Place of choice for the audio picker, e.g. `preset:emergency`. */
  placeKey: string
  submit: (input: AnnouncementPresetInput) => Promise<unknown>
  pending: boolean
}

type FormVariant = { languageCode: string; audioAssetId: string; text: string }
type FormValues = { name: string; variants: FormVariant[] }

/**
 * Editor of an announcement preset: a name plus one row per language, each pointing
 * at an audio asset that is either picked from the audio library (task 031) or
 * voiced on the spot through TTS (task 021).
 *
 * Shared by the supplementary (024) and emergency (026) catalogs — the owning
 * feature passes in its own save mutation, so this component never knows which
 * catalog it edits.
 */
export function AnnouncementPresetForm({
  preset,
  onClose,
  title,
  namePlaceholder,
  placeKey,
  submit,
  pending,
}: Props) {
  const languagesQuery = useLanguages()
  const generate = useGenerateAudioAsset()
  const [error, setError] = useState<string | null>(null)
  // Index of the variant currently being voiced, to scope the button spinner.
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)

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
          {error && <Alert color="danger">{error}</Alert>}

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
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        mt={4}
                        aria-label={`Удалить вариант ${index + 1}`}
                        disabled={form.values.variants.length === 1}
                        onClick={() => form.removeListItem('variants', index)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                    <AudioAssetPicker
                      label={`Аудио варианта ${index + 1}`}
                      hideLabel
                      value={form.values.variants[index].audioAssetId || null}
                      onChange={(audioAssetId) =>
                        form.setFieldValue(`variants.${index}.audioAssetId`, audioAssetId)
                      }
                      languageCode={form.values.variants[index].languageCode}
                      placeKey={placeKey}
                      error={form.errors[`variants.${index}.audioAssetId`]}
                    />
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
