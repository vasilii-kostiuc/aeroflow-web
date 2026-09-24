import type { ReactNode } from 'react'

import {
  Anchor,
  Box,
  Breadcrumbs,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'

import { useLibraryDnd } from '../hooks/useLibraryDnd'
import { assetsInView, filterAssets, isFlatView } from '../model/filters'
import {
  countAssets,
  folderAncestry,
  folderOptions,
} from '../model/folderTree'
import {
  ALL_FILES,
  ALL_LANGUAGES,
  NO_FOLDER,
  type AudioAsset,
  type AudioFolder,
  type LibraryFilters,
} from '../model/types'
import { AssetTable } from './AssetTable'
import { FolderTree } from './FolderTree'

type Props = {
  assets: AudioAsset[]
  folders: AudioFolder[]
  filters: LibraryFilters
  onFiltersChange: (filters: LibraryFilters) => void
  /** Language choices for the language filter. */
  languageOptions: { value: string; label: string }[]
  /** Language of the variant being edited (picker only). */
  variantLanguage?: string
  selectedAssetId?: string | null
  /** Picker: a row click picks the asset. */
  onPick?: (asset: AudioAsset) => void
  /** Picker: recently picked ids, newest first. Shown above the table. */
  recentIds?: string[]
  renderAssetActions?: (asset: AudioAsset) => ReactNode
  /** Actions for the open folder, shown next to the breadcrumbs. */
  folderActions?: ReactNode
  /** Per-folder menu in the tree (library screen). */
  renderFolderMenu?: (folder: AudioFolder) => ReactNode
  /** Checkbox selection of files (library screen). */
  selection?: Set<string>
  onSelectionChange?: (selection: Set<string>) => void
  /** Drag and drop moves (library screen); without them nothing is draggable. */
  onMoveAssets?: (ids: string[], folderId: string | null) => void
  onMoveFolder?: (folder: AudioFolder, parentId: string | null) => void
  emptyText?: string
}

const sourceOptions = [
  { value: 'all', label: 'Все' },
  { value: 'uploaded', label: 'Загруженные' },
  { value: 'generated', label: 'Озвученные' },
]

/**
 * The audio library as a folder tree plus a table (task 031). Shared by the
 * picker modal and the «Аудиобиблиотека» screen; the owner keeps the filter state
 * (local state in the picker, the URL on the screen).
 */
export function LibraryBrowser({
  assets,
  folders,
  filters,
  onFiltersChange,
  languageOptions,
  variantLanguage,
  selectedAssetId,
  onPick,
  recentIds = [],
  renderAssetActions,
  folderActions,
  renderFolderMenu,
  selection,
  onSelectionChange,
  onMoveAssets,
  onMoveFolder,
  emptyText = 'Здесь пока нет файлов.',
}: Props) {
  const narrow = useMediaQuery('(max-width: 48em)')
  const dnd = useLibraryDnd({ folders, assets, onMoveAssets, onMoveFolder })
  const set = (patch: Partial<LibraryFilters>) => onFiltersChange({ ...filters, ...patch })

  const filtered = filterAssets(assets, filters)
  const counts = countAssets(filtered, folders)
  const flat = isFlatView(filters)
  const inView = assetsInView(filtered, folders, filters)
  const subfolders =
    flat || filters.folder === NO_FOLDER
      ? []
      : folders
          .filter((folder) => folder.parentId === filters.folder)
          .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }))

  const searching = Boolean(filters.search.trim())
  // Recent picks are a shortcut across folders and sources: only the language applies.
  const recent = searching
    ? []
    : sortByRecency(
        filterAssets(assets, { language: filters.language, source: 'all', search: '' }),
        recentIds,
      )

  const breadcrumbs = (
    <Breadcrumbs separator="/">
      <Anchor component="button" type="button" size="sm" onClick={() => set({ folder: ALL_FILES })}>
        Все файлы
      </Anchor>
      {filters.folder === NO_FOLDER && <Text size="sm">Без папки</Text>}
      {filters.folder !== ALL_FILES &&
        filters.folder !== NO_FOLDER &&
        folderAncestry(folders, filters.folder).map((folder, index, chain) =>
          index === chain.length - 1 ? (
            <Text key={folder.id} size="sm" fw={500}>
              {folder.name}
            </Text>
          ) : (
            <Anchor
              key={folder.id}
              component="button"
              type="button"
              size="sm"
              onClick={() => set({ folder: folder.id })}
            >
              {folder.name}
            </Anchor>
          ),
        )}
    </Breadcrumbs>
  )

  const languageFilter = variantLanguage ? (
      <SegmentedControl
        aria-label="Фильтр языка"
        value={filters.language === ALL_LANGUAGES ? ALL_LANGUAGES : variantLanguage}
        onChange={(language) => set({ language })}
        data={[
          { value: variantLanguage, label: `Язык варианта (${variantLanguage})` },
          { value: ALL_LANGUAGES, label: 'Все языки' },
        ]}
      />
    ) : (
      <Select
        aria-label="Фильтр языка"
        allowDeselect={false}
        w={180}
        value={filters.language}
        onChange={(language) => set({ language: language ?? ALL_LANGUAGES })}
        data={[{ value: ALL_LANGUAGES, label: 'Все языки' }, ...languageOptions]}
      />
    )

  return (
    <Box
      style={{
        display: 'grid',
        gap: 'var(--mantine-spacing-md)',
        gridTemplateColumns: narrow ? '1fr' : 'minmax(200px, 260px) minmax(0, 1fr)',
        alignItems: 'start',
      }}
    >
      {narrow ? (
        <Select
          aria-label="Папка"
          allowDeselect={false}
          value={filters.folder}
          onChange={(folder) => set({ folder: folder ?? ALL_FILES })}
          data={[
            { value: ALL_FILES, label: 'Все файлы' },
            ...folderOptions(folders),
            { value: NO_FOLDER, label: 'Без папки' },
          ]}
        />
      ) : (
        <Paper withBorder p={4}>
          <FolderTree
            folders={folders}
            counts={counts}
            selected={filters.folder}
            onSelect={(folder) => set({ folder })}
            renderFolderMenu={renderFolderMenu}
            dnd={dnd}
          />
        </Paper>
      )}

      <Stack gap="sm" style={{ minWidth: 0 }}>
        <Group justify="space-between" wrap="nowrap" gap="sm">
          {searching ? (
            <Text size="sm" c="dimmed">
              Поиск по всей библиотеке
            </Text>
          ) : (
            breadcrumbs
          )}
          {!searching && folderActions}
        </Group>

        <Group gap="sm" wrap="wrap">
          <TextInput
            aria-label="Поиск файла"
            placeholder="Название или имя файла"
            leftSection={<IconSearch size={16} />}
            value={filters.search}
            onChange={(event) => set({ search: event.currentTarget.value })}
            style={{ flex: 1, minWidth: 200 }}
          />
          {languageFilter}
          <Select
            aria-label="Источник"
            allowDeselect={false}
            w={170}
            value={filters.source}
            onChange={(source) =>
              set({ source: (source ?? 'all') as LibraryFilters['source'] })
            }
            data={sourceOptions}
          />
        </Group>

        {recent.length > 0 && (
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Недавно использованные
            </Text>
            <AssetTable
              aria-label="Недавно использованные"
              assets={recent}
              folders={folders}
              flat
              variantLanguage={variantLanguage}
              selectedAssetId={selectedAssetId}
              onRowClick={onPick}
              renderActions={renderAssetActions}
            />
          </Stack>
        )}

        {inView.length === 0 && subfolders.length === 0 ? (
          <Text c="dimmed" size="sm" py="md">
            {searching ? 'Ничего не найдено.' : emptyText}
          </Text>
        ) : (
          <AssetTable
            aria-label="Файлы"
            assets={inView}
            subfolders={subfolders}
            folders={folders}
            flat={flat}
            variantLanguage={variantLanguage}
            selectedAssetId={selectedAssetId}
            onOpenFolder={(folder) => set({ folder })}
            onRowClick={onPick}
            renderActions={renderAssetActions}
            selection={selection}
            onSelectionChange={onSelectionChange}
            dnd={dnd}
          />
        )}
      </Stack>
    </Box>
  )
}

function sortByRecency(assets: AudioAsset[], recentIds: string[]): AudioAsset[] {
  const byId = new Map(assets.map((asset) => [asset.id, asset]))

  return recentIds.flatMap((id) => {
    const asset = byId.get(id)

    return asset ? [asset] : []
  })
}
