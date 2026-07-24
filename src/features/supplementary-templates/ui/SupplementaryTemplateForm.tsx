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

import {
  useAudioAssets,
  useCreateSupplementaryTemplate,
  useGenerateAudioAsset,
  useUpdateSupplementaryTemplate,
} from '../hooks/useSupplementaryTemplates'
import type {
  AudioAsset,
  SupplementaryTemplate,
  SupplementaryTemplateInput,
} from '../model/types'

type Props = {
  template: SupplementaryTemplate | null
  onClose: () => void
}

type FormVariant = { languageCode: string; audioAssetId: string; text: string }
type FormValues = { name: string; variants: FormVariant[] }

export function SupplementaryTemplateForm({ template, onClose }: Props) {
  const create = useCreateSupplementaryTemplate()
  const update = useUpdateSupplementaryTemplate()
  const generate = useGenerateAudioAsset()
  const languagesQuery = useLanguages()
  const assetsQuery = useAudioAssets()
  const [error, setError] = useState<string | null>(null)
  // Index of the variant currently being voiced, to scope the button spinner.
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  // Freshly generated assets, kept locally so the picker shows them immediately
  // (before the assets query refetch lands).
  const [generatedAssets, setGeneratedAssets] = useState<AudioAsset[]>([])

  const mutation = template ? update : create

  const form = useForm<FormValues>({
    initialValues: template
      ? {
          name: template.name,
          variants: template.variants.map((variant) => ({ ...variant, text: '' })),
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

  const assetOptions = [...(assetsQuery.data ?? []), ...generatedAssets]
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

  async function submit(values: FormValues) {
    setError(null)

    const languages = values.variants.map((variant) => variant.languageCode)
    if (new Set(languages).size !== languages.length) {
      setError('Языки вариантов не должны повторяться.')

      return
    }

    const input: SupplementaryTemplateInput = {
      name: values.name.trim(),
      variants: values.variants.map(({ languageCode, audioAssetId }) => ({
        languageCode,
        audioAssetId,
      })),
    }

    try {
      if (template) {
        await update.mutateAsync({ id: template.id, input })
      } else {
        await create.mutateAsync(input)
      }
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
      title={template ? 'Редактировать объявление' : 'Новое дополнительное объявление'}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}

          <TextInput
            label="Название"
            placeholder="Например, Безопасность"
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
                        disabled={assetsQuery.isLoading}
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
            <Button variant="default" onClick={onClose} disabled={mutation.isPending}>
              Отмена
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
