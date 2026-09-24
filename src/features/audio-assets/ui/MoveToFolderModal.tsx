import { useState } from 'react'

import { Alert, Button, Group, Modal, Select, Stack, Text } from '@mantine/core'

import { ApiClientError } from '@/shared/api/apiClient'

import { canMoveFolder, folderOptions } from '../model/folderTree'
import type { AudioFolder } from '../model/types'

const ROOT = 'root'

type Props = {
  folders: AudioFolder[]
  /** What moves: files, or one folder (whose subtree is not a valid target). */
  subject: { kind: 'assets'; count: number; label: string } | { kind: 'folder'; folder: AudioFolder }
  onMove: (folderId: string | null) => Promise<unknown>
  onClose: () => void
}

/**
 * «Переместить в…» — the keyboard- and touch-friendly twin of drag and drop, for
 * one file, several files or a folder. Only valid destinations are offered.
 */
export function MoveToFolderModal({ folders, subject, onMove, onClose }: Props) {
  const [target, setTarget] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options =
    subject.kind === 'assets'
      ? [{ value: ROOT, label: 'Без папки' }, ...folderOptions(folders)]
      : [
          ...(canMoveFolder(folders, subject.folder.id, null)
            ? [{ value: ROOT, label: 'Верхний уровень' }]
            : []),
          ...folderOptions(folders).filter((option) =>
            canMoveFolder(folders, subject.folder.id, option.value),
          ),
        ]

  async function move() {
    if (target === null) return
    setError(null)
    setPending(true)
    try {
      await onMove(target === ROOT ? null : target)
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Не удалось переместить.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal opened onClose={onClose} title="Переместить" centered zIndex={400}>
      <Stack>
        <Text size="sm">
          {subject.kind === 'assets' ? subject.label : `Папка «${subject.folder.name}»`}
        </Text>
        <Select
          label="Куда"
          placeholder={options.length ? 'Выберите папку' : 'Некуда переместить'}
          data={options}
          value={target}
          onChange={setTarget}
          searchable
          comboboxProps={{ zIndex: 410 }}
        />
        {error && <Alert color="danger">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button loading={pending} disabled={target === null} onClick={() => void move()}>
            Переместить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
