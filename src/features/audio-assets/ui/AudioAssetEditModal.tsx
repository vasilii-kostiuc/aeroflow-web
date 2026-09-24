import { useState } from 'react'

import { Alert, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'

import { ApiClientError } from '@/shared/api/apiClient'

import { useUpdateAudioAsset } from '../hooks/useAudioAssets'
import { folderOptions } from '../model/folderTree'
import { NO_FOLDER, type AudioAsset, type AudioFolder } from '../model/types'

type Props = {
  asset: AudioAsset
  folders: AudioFolder[]
  onClose: () => void
}

/** Rename an asset and move it to another folder. The file itself never changes. */
export function AudioAssetEditModal({ asset, folders, onClose }: Props) {
  const update = useUpdateAudioAsset()
  const [title, setTitle] = useState(asset.title)
  const [folder, setFolder] = useState<string>(asset.folderId ?? NO_FOLDER)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    try {
      await update.mutateAsync({
        id: asset.id,
        input: { title: title.trim(), folderId: folder === NO_FOLDER ? null : folder },
      })
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Не удалось сохранить файл.')
    }
  }

  return (
    <Modal opened onClose={onClose} title="Изменить аудиофайл" centered>
      <Stack>
        <TextInput
          label="Название"
          description={`Файл: ${asset.name}`}
          required
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <Select
          label="Папка"
          allowDeselect={false}
          data={[{ value: NO_FOLDER, label: 'Без папки' }, ...folderOptions(folders)]}
          value={folder}
          onChange={(value) => setFolder(value ?? NO_FOLDER)}
        />
        {error && <Alert color="danger">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={update.isPending}>
            Отмена
          </Button>
          <Button loading={update.isPending} disabled={!title.trim()} onClick={() => void save()}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
