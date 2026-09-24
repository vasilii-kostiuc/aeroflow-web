import { useState } from 'react'

import { Alert, Button, FileInput, Group, Paper, Select, Stack, TextInput } from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'

import { ApiClientError } from '@/shared/api/apiClient'

import { useUploadAudioAsset } from '../hooks/useAudioAssets'
import { folderOptions } from '../model/folderTree'
import { NO_FOLDER, type AudioAsset, type AudioFolder } from '../model/types'

type Props = {
  folders: AudioFolder[]
  languageOptions: { value: string; label: string }[]
  defaultLanguage?: string
  /** Folder to upload into by default; null = «Без папки». */
  defaultFolderId: string | null
  onUploaded: (asset: AudioAsset) => void
  onCancel: () => void
}

/** Upload one file into the library with a title, a language and a folder. */
export function AudioAssetUploadForm({
  folders,
  languageOptions,
  defaultLanguage,
  defaultFolderId,
  onUploaded,
  onCancel,
}: Props) {
  const upload = useUploadAudioAsset()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [languageCode, setLanguageCode] = useState(defaultLanguage ?? '')
  const [folder, setFolder] = useState<string>(defaultFolderId ?? NO_FOLDER)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!file || !languageCode) return

    setError(null)
    try {
      const asset = await upload.mutateAsync({
        file,
        languageCode,
        title,
        folderId: folder === NO_FOLDER ? null : folder,
      })
      onUploaded(asset)
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Не удалось загрузить аудиофайл.',
      )
    }
  }

  return (
    <Paper withBorder p="sm">
      <Stack gap="xs">
        <FileInput
          label="Аудиофайл"
          description="WAV, MP3 или OGG, не более 50 МБ"
          accept="audio/wav,audio/x-wav,audio/mpeg,audio/ogg,.wav,.mp3,.ogg"
          clearable
          required
          value={file}
          onChange={setFile}
        />
        <TextInput
          label="Название"
          placeholder="Если пусто — по имени файла"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <Group grow align="flex-start">
          <Select
            label="Язык"
            required
            allowDeselect={false}
            data={languageOptions}
            value={languageCode || null}
            onChange={(value) => setLanguageCode(value ?? '')}
          />
          <Select
            label="Папка"
            allowDeselect={false}
            data={[{ value: NO_FOLDER, label: 'Без папки' }, ...folderOptions(folders)]}
            value={folder}
            onChange={(value) => setFolder(value ?? NO_FOLDER)}
          />
        </Group>
        {error && <Alert color="danger">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={upload.isPending}>
            Отмена
          </Button>
          <Button
            leftSection={<IconUpload size={16} />}
            loading={upload.isPending}
            disabled={!file || !languageCode}
            onClick={() => void submit()}
          >
            Загрузить
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}
