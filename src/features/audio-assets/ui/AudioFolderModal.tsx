import { useState } from 'react'

import { Alert, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'

import { ApiClientError } from '@/shared/api/apiClient'

import { useCreateAudioFolder, useUpdateAudioFolder } from '../hooks/useAudioFolders'
import {
  canMoveFolder,
  folderAncestry,
  folderOptions,
  MAX_FOLDER_DEPTH,
} from '../model/folderTree'
import type { AudioFolder } from '../model/types'

const TOP_LEVEL = 'top'

type Props = {
  folders: AudioFolder[]
  /** Folder being renamed/moved; absent when creating. */
  folder?: AudioFolder
  /** Parent preselected for a new folder. */
  parentId?: string | null
  onClose: () => void
  onSaved?: (folder: AudioFolder) => void
  /** Raise above another modal (the picker). */
  zIndex?: number
}

/**
 * Create a folder, or rename and move an existing one. Parents the server would
 * refuse (the folder itself, its subfolders, too deep) are not offered.
 */
export function AudioFolderModal({
  folders,
  folder,
  parentId = null,
  onClose,
  onSaved,
  zIndex,
}: Props) {
  const create = useCreateAudioFolder()
  const update = useUpdateAudioFolder()
  const [name, setName] = useState(folder?.name ?? '')
  const [parent, setParent] = useState<string>((folder ? folder.parentId : parentId) ?? TOP_LEVEL)
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending
  // Only parents the server would accept: no cycles, no deeper than the limit.
  const parentOptions = folderOptions(folders).filter((option) =>
    folder
      ? option.value === folder.parentId || canMoveFolder(folders, folder.id, option.value)
      : folderAncestry(folders, option.value).length < MAX_FOLDER_DEPTH,
  )

  async function save() {
    setError(null)
    const input = { name: name.trim(), parentId: parent === TOP_LEVEL ? null : parent }
    try {
      const saved = folder
        ? await update.mutateAsync({ id: folder.id, input })
        : await create.mutateAsync(input)
      onSaved?.(saved)
      onClose()
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? 'Папка с таким названием здесь уже есть.'
          : caught instanceof ApiClientError
            ? caught.message
            : 'Не удалось сохранить папку.',
      )
    }
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={folder ? 'Изменить папку' : 'Новая папка'}
      centered
      zIndex={zIndex}
    >
      <Stack>
        <TextInput
          label="Название"
          required
          data-autofocus
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Select
          label="Расположение"
          allowDeselect={false}
          data={[
            { value: TOP_LEVEL, label: 'Верхний уровень' },
            ...parentOptions,
          ]}
          value={parent}
          onChange={(value) => setParent(value ?? TOP_LEVEL)}
          comboboxProps={zIndex ? { zIndex: zIndex + 10 } : undefined}
        />
        {error && <Alert color="danger">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button loading={pending} disabled={!name.trim()} onClick={() => void save()}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
