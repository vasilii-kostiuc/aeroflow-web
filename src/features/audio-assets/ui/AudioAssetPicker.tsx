import { useEffect, useState, type ReactNode } from 'react'

import { Badge, Button, Group, Input, Loader, Modal, Paper, Stack, Text } from '@mantine/core'
import { IconFolderPlus, IconUpload } from '@tabler/icons-react'

import { useAuthStore } from '@/features/auth/model/authStore'
import { useLanguages } from '@/features/languages/hooks/useLanguages'
import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import { useAudioAssets } from '../hooks/useAudioAssets'
import { useAudioFolders } from '../hooks/useAudioFolders'
import { effectiveFolderId, existingSelection } from '../model/folderTree'
import { selectUserPreferences, useLibraryPreferences } from '../model/libraryPreferences'
import {
  ALL_FILES,
  ALL_LANGUAGES,
  NO_FOLDER,
  type AudioAsset,
  type AudioFolder,
  type FolderSelection,
  type LibraryFilters,
} from '../model/types'
import { AudioAssetUploadForm } from './AudioAssetUploadForm'
import { AudioFolderModal } from './AudioFolderModal'
import { LibraryBrowser } from './LibraryBrowser'

type Props = {
  value: string | null
  onChange: (audioAssetId: string) => void
  /** Language of the variant the file is for; empty when not chosen yet. */
  languageCode: string
  /**
   * Where the choice is made, e.g. `segment:boarding_invitation` or
   * `preset:emergency`. The picker reopens in the folder last used for it.
   */
  placeKey: string
  /** Field label; also names the buttons for assistive technology. */
  label: string
  hideLabel?: boolean
  error?: ReactNode
}

/**
 * Picks an audio asset from the library (task 031): the field shows the chosen
 * asset by title, the modal browses folders with filters and in-row preview, and
 * lists recent picks first.
 */
export function AudioAssetPicker({
  value,
  onChange,
  languageCode,
  placeKey,
  label,
  hideLabel = false,
  error,
}: Props) {
  const assetsQuery = useAudioAssets()
  const foldersQuery = useAudioFolders()
  const [opened, setOpened] = useState(false)

  const assets = assetsQuery.data ?? []
  const selected = value ? assets.find((asset) => asset.id === value) : undefined

  return (
    <Input.Wrapper label={hideLabel ? undefined : label} error={error}>
      <Group gap="xs" wrap="nowrap" align="center">
        <Paper withBorder px="sm" py={6} style={{ flex: 1, minWidth: 0 }}>
          {!value ? (
            <Text size="sm" c="dimmed">
              Файл не выбран
            </Text>
          ) : selected ? (
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" fw={500} truncate>
                {selected.title}
              </Text>
              <Badge variant="light" color="gray" style={{ flexShrink: 0 }}>
                {selected.languageCode}
              </Badge>
            </Group>
          ) : assetsQuery.isLoading ? (
            <Loader size="xs" />
          ) : (
            <Text size="sm" c="danger">
              Файл недоступен
            </Text>
          )}
        </Paper>
        <AudioPreviewButton audioAssetId={selected ? value : null} />
        <Button
          variant="light"
          aria-label={`Выбрать: ${label}`}
          onClick={() => setOpened(true)}
        >
          {value ? 'Изменить…' : 'Выбрать…'}
        </Button>
      </Group>

      {opened && (
        <PickerModal
          assets={assets}
          folders={foldersQuery.data ?? []}
          value={value}
          languageCode={languageCode}
          placeKey={placeKey}
          onClose={() => setOpened(false)}
          onPick={(asset) => {
            onChange(asset.id)
            setOpened(false)
          }}
        />
      )}
    </Input.Wrapper>
  )
}

function PickerModal({
  assets,
  folders,
  value,
  languageCode,
  placeKey,
  onClose,
  onPick,
}: {
  assets: AudioAsset[]
  folders: AudioFolder[]
  value: string | null
  languageCode: string
  placeKey: string
  onClose: () => void
  onPick: (asset: AudioAsset) => void
}) {
  const userId = useAuthStore((state) => state.session?.user.id ?? 'anonymous')
  const preferences = useLibraryPreferences(selectUserPreferences(userId))
  const rememberPick = useLibraryPreferences((state) => state.rememberPick)
  const pruneRecent = useLibraryPreferences((state) => state.pruneRecent)
  const languagesQuery = useLanguages()
  const [uploading, setUploading] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)

  const [filters, setFilters] = useState<LibraryFilters>(() => ({
    folder: initialFolder(
      assets,
      folders,
      value,
      preferences.lastFolderByPlace[placeKey],
    ),
    language: languageCode || ALL_LANGUAGES,
    source: 'all',
    search: '',
  }))

  // Forget recent picks that are no longer active assets.
  useEffect(() => {
    if (assets.length > 0) {
      pruneRecent(userId, new Set(assets.map((asset) => asset.id)))
    }
  }, [assets, pruneRecent, userId])

  function pick(asset: AudioAsset) {
    rememberPick(userId, placeKey, asset.id, effectiveFolderId(asset, folders) ?? NO_FOLDER)
    onPick(asset)
  }

  const languageOptions = (languagesQuery.data ?? []).map((language) => ({
    value: language.code,
    label: `${language.name} (${language.code})`,
  }))
  const openFolderId =
    filters.folder === ALL_FILES || filters.folder === NO_FOLDER ? null : filters.folder

  return (
    // Opened from inside other modals (segment editor, preset form): keep it on top.
    <Modal opened onClose={onClose} title="Выбор аудиофайла" size="80rem" centered zIndex={300}>
      <Stack>
        {uploading ? (
          <AudioAssetUploadForm
            folders={folders}
            languageOptions={languageOptions}
            defaultLanguage={languageCode}
            defaultFolderId={openFolderId}
            onUploaded={pick}
            onCancel={() => setUploading(false)}
          />
        ) : (
          <Group justify="flex-end">
            <Button
              variant="default"
              leftSection={<IconFolderPlus size={16} />}
              onClick={() => setCreatingFolder(true)}
            >
              Новая папка
            </Button>
            <Button
              variant="light"
              leftSection={<IconUpload size={16} />}
              onClick={() => setUploading(true)}
            >
              Загрузить файл
            </Button>
          </Group>
        )}
        <LibraryBrowser
          assets={assets}
          folders={folders}
          filters={filters}
          onFiltersChange={setFilters}
          languageOptions={languageOptions}
          variantLanguage={languageCode || undefined}
          selectedAssetId={value}
          onPick={pick}
          recentIds={preferences.recent}
          renderAssetActions={(asset) => (
            <Button
              size="compact-sm"
              variant="light"
              aria-label={`Выбрать ${asset.title}`}
              onClick={() => pick(asset)}
            >
              Выбрать
            </Button>
          )}
        />
      </Stack>
      {creatingFolder && (
        <AudioFolderModal
          folders={folders}
          parentId={openFolderId}
          zIndex={400}
          onClose={() => setCreatingFolder(false)}
          onSaved={(folder) => setFilters((current) => ({ ...current, folder: folder.id }))}
        />
      )}
    </Modal>
  )
}

/**
 * Where the picker opens: the folder of the asset already chosen, else the folder
 * last picked from at this place, else «Все файлы».
 */
function initialFolder(
  assets: AudioAsset[],
  folders: AudioFolder[],
  value: string | null,
  lastFolder: FolderSelection | undefined,
): FolderSelection {
  const selectedAsset = value ? assets.find((asset) => asset.id === value) : undefined
  if (selectedAsset) return effectiveFolderId(selectedAsset, folders) ?? NO_FOLDER

  return existingSelection(lastFolder, folders) ?? ALL_FILES
}
