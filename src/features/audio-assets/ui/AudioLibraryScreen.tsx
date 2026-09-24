import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Menu,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconDotsVertical,
  IconEdit,
  IconFolderPlus,
  IconFolderShare,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'

import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { ApiClientError } from '@/shared/api/apiClient'
import { PageHeader } from '@/shared/ui/PageHeader'

import { useAudioAssets, useMoveAudioAssets } from '../hooks/useAudioAssets'
import {
  useAudioFolders,
  useDeleteAudioFolder,
  useMoveAudioFolder,
} from '../hooks/useAudioFolders'
import { folderPath } from '../model/folderTree'
import {
  ALL_FILES,
  NO_FOLDER,
  type AudioAsset,
  type AudioFolder,
  type LibraryFilters,
} from '../model/types'
import { AudioAssetEditModal } from './AudioAssetEditModal'
import { AudioAssetUploadForm } from './AudioAssetUploadForm'
import { AudioFolderModal } from './AudioFolderModal'
import { LibraryBrowser } from './LibraryBrowser'
import { MoveToFolderModal } from './MoveToFolderModal'

type Props = {
  filters: LibraryFilters
  onFiltersChange: (filters: LibraryFilters) => void
}

type FolderDialog =
  | { mode: 'create'; parentId: string | null }
  | { mode: 'edit'; folder: AudioFolder }
type MoveDialog = { kind: 'assets'; ids: string[] } | { kind: 'folder'; folder: AudioFolder }

const filesLabel = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} файл`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} файла`

  return `${count} файлов`
}

const moveError = (caught: unknown) =>
  notifications.show({
    color: 'danger',
    message:
      caught instanceof ApiClientError ? caught.message : 'Не удалось переместить — изменения отменены.',
  })

/**
 * «Аудиобиблиотека» (task 031): browse, listen, upload, rename and sort audio
 * files into folders — with menus, «Переместить в…» and drag and drop, one file
 * or a selection at a time. The owning page keeps the filters in the URL.
 */
export function AudioLibraryScreen({ filters, onFiltersChange }: Props) {
  const assetsQuery = useAudioAssets()
  const foldersQuery = useAudioFolders()
  const languagesQuery = useLanguages()
  const deleteFolder = useDeleteAudioFolder()
  const moveAssets = useMoveAudioAssets()
  const moveFolder = useMoveAudioFolder()
  const [uploading, setUploading] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AudioAsset | null>(null)
  const [folderDialog, setFolderDialog] = useState<FolderDialog | null>(null)
  const [moveDialog, setMoveDialog] = useState<MoveDialog | null>(null)
  const [selection, setSelection] = useState<Set<string>>(() => new Set())

  const assets = assetsQuery.data ?? []
  const folders = foldersQuery.data ?? []
  const languageOptions = (languagesQuery.data ?? []).map((language) => ({
    value: language.code,
    label: `${language.name} (${language.code})`,
  }))
  const openFolder =
    filters.folder === ALL_FILES || filters.folder === NO_FOLDER
      ? undefined
      : folders.find((folder) => folder.id === filters.folder)
  // Only assets that still exist count as selected.
  const selectedIds = assets.filter((asset) => selection.has(asset.id)).map((asset) => asset.id)

  // A selection belongs to the view it was made in.
  function changeFilters(next: LibraryFilters) {
    setSelection(new Set())
    onFiltersChange(next)
  }

  const isEmpty = (folder: AudioFolder) =>
    !folders.some((item) => item.parentId === folder.id) &&
    !assets.some((asset) => asset.folderId === folder.id)

  function moveAssetsTo(ids: string[], folderId: string | null) {
    return moveAssets.mutateAsync(
      { ids, folderId },
      {
        onSuccess: () => {
          setSelection(new Set())
          notifications.show({
            color: 'success',
            message: `${filesLabel(ids.length)} → ${folderPath(folders, folderId)}`,
          })
        },
      },
    )
  }

  function moveFolderTo(folder: AudioFolder, parentId: string | null) {
    return moveFolder.mutateAsync({ folder, parentId })
  }

  function confirmDelete(folder: AudioFolder) {
    modals.openConfirmModal({
      title: 'Удалить папку?',
      children: `Папка «${folder.name}» будет удалена.`,
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'danger' },
      onConfirm: () =>
        deleteFolder.mutate(folder.id, {
          onSuccess: () => {
            if (filters.folder === folder.id) {
              changeFilters({ ...filters, folder: folder.parentId ?? ALL_FILES })
            }
          },
          onError: (caught) =>
            notifications.show({
              color: 'danger',
              message:
                caught instanceof ApiClientError && caught.status === 409
                  ? 'В папке есть файлы или подпапки — удалить можно только пустую папку.'
                  : 'Не удалось удалить папку.',
            }),
        }),
    })
  }

  const folderMenu = (folder: AudioFolder, label = `Действия с папкой ${folder.name}`) => {
    const empty = isEmpty(folder)

    return (
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" size="sm" aria-label={label}>
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconFolderPlus size={16} />}
            onClick={() => setFolderDialog({ mode: 'create', parentId: folder.id })}
          >
            Новая подпапка
          </Menu.Item>
          <Menu.Item
            leftSection={<IconEdit size={16} />}
            onClick={() => setFolderDialog({ mode: 'edit', folder })}
          >
            Переименовать
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFolderShare size={16} />}
            onClick={() => setMoveDialog({ kind: 'folder', folder })}
          >
            Переместить в…
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="danger"
            leftSection={<IconTrash size={16} />}
            disabled={!empty}
            onClick={() => confirmDelete(folder)}
          >
            {empty ? 'Удалить' : 'Удалить (сначала уберите файлы и подпапки)'}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    )
  }

  const assetMenu = (asset: AudioAsset) => (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={`Действия с файлом ${asset.title}`}>
          <IconDotsVertical size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => setEditingAsset(asset)}>
          Изменить
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFolderShare size={16} />}
          onClick={() => setMoveDialog({ kind: 'assets', ids: [asset.id] })}
        >
          Переместить в…
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )

  return (
    <Stack gap="lg">
      <PageHeader
        title="Аудиобиблиотека"
        description="Все аудиофайлы объявлений: прослушивание, названия и раскладка по папкам. Файлы и папки можно перетаскивать на папки слева."
        actions={
          <>
            <Button
              variant="default"
              leftSection={<IconFolderPlus size={18} />}
              onClick={() => setFolderDialog({ mode: 'create', parentId: openFolder?.id ?? null })}
            >
              Новая папка
            </Button>
            <Button leftSection={<IconUpload size={18} />} onClick={() => setUploading(true)}>
              Загрузить файл
            </Button>
          </>
        }
      />

      {uploading && (
        <AudioAssetUploadForm
          folders={folders}
          languageOptions={languageOptions}
          defaultFolderId={openFolder?.id ?? null}
          onUploaded={() => setUploading(false)}
          onCancel={() => setUploading(false)}
        />
      )}

      {selectedIds.length > 0 && (
        <Paper withBorder p="sm" bg="var(--mantine-color-blue-light)">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text size="sm" fw={500}>
              Выбрано: {filesLabel(selectedIds.length)}. Перетащите на папку или
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                leftSection={<IconFolderShare size={16} />}
                onClick={() => setMoveDialog({ kind: 'assets', ids: selectedIds })}
              >
                Переместить в…
              </Button>
              <Button size="xs" variant="default" onClick={() => setSelection(new Set())}>
                Снять выделение
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      <Paper withBorder p="lg">
        {assetsQuery.isPending || foldersQuery.isPending ? (
          <Loader aria-label="Загрузка аудиобиблиотеки" />
        ) : assetsQuery.isError || foldersQuery.isError ? (
          <Alert color="danger">Не удалось загрузить аудиобиблиотеку.</Alert>
        ) : (
          <LibraryBrowser
            assets={assets}
            folders={folders}
            filters={filters}
            onFiltersChange={changeFilters}
            languageOptions={languageOptions}
            folderActions={openFolder ? folderMenu(openFolder) : null}
            renderFolderMenu={(folder) => folderMenu(folder, `Меню папки ${folder.name}`)}
            selection={selection}
            onSelectionChange={setSelection}
            onMoveAssets={(ids, folderId) => void moveAssetsTo(ids, folderId).catch(moveError)}
            onMoveFolder={(folder, parentId) =>
              void moveFolderTo(folder, parentId).catch(moveError)
            }
            emptyText="В этой папке пока нет файлов."
            renderAssetActions={assetMenu}
          />
        )}
      </Paper>

      {editingAsset && (
        <AudioAssetEditModal
          asset={editingAsset}
          folders={folders}
          onClose={() => setEditingAsset(null)}
        />
      )}
      {folderDialog && (
        <AudioFolderModal
          folders={folders}
          folder={folderDialog.mode === 'edit' ? folderDialog.folder : undefined}
          parentId={folderDialog.mode === 'create' ? folderDialog.parentId : null}
          onClose={() => setFolderDialog(null)}
          onSaved={(folder) =>
            folderDialog.mode === 'create' && changeFilters({ ...filters, folder: folder.id })
          }
        />
      )}
      {moveDialog && (
        <MoveToFolderModal
          folders={folders}
          subject={
            moveDialog.kind === 'folder'
              ? moveDialog
              : {
                  kind: 'assets',
                  count: moveDialog.ids.length,
                  label:
                    moveDialog.ids.length === 1
                      ? `Файл «${assets.find((asset) => asset.id === moveDialog.ids[0])?.title ?? ''}»`
                      : filesLabel(moveDialog.ids.length),
                }
          }
          onMove={(folderId) =>
            moveDialog.kind === 'folder'
              ? moveFolderTo(moveDialog.folder, folderId)
              : moveAssetsTo(moveDialog.ids, folderId)
          }
          onClose={() => setMoveDialog(null)}
        />
      )}
    </Stack>
  )
}
