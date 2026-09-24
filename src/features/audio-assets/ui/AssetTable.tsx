import type { ReactNode } from 'react'

import { Badge, Checkbox, Group, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { IconFolder, IconGripVertical } from '@tabler/icons-react'

import { AudioPreviewButton } from '@/shared/ui/AudioPreviewButton'

import type { LibraryDnd } from '../hooks/useLibraryDnd'
import { folderPath } from '../model/folderTree'
import { sourceLabels } from '../model/labels'
import type { AudioAsset, AudioFolder } from '../model/types'

type Props = {
  assets: AudioAsset[]
  /** Subfolders of the open folder, listed before its files. */
  subfolders?: AudioFolder[]
  folders: AudioFolder[]
  /** Flat view across folders: adds a folder column. */
  flat: boolean
  /** Language of the variant being edited; other languages get a badge. */
  variantLanguage?: string
  selectedAssetId?: string | null
  onOpenFolder?: (folderId: string) => void
  /** Row click in the picker; absent on the library screen. */
  onRowClick?: (asset: AudioAsset) => void
  /** Actions at the end of an asset row, after the play button. */
  renderActions?: (asset: AudioAsset) => ReactNode
  /** Checkbox selection (library screen). */
  selection?: Set<string>
  onSelectionChange?: (selection: Set<string>) => void
  dnd?: LibraryDnd
  'aria-label'?: string
}

const noSelection = new Set<string>()

/** Subfolders then files of the library, each file with an in-row preview. */
export function AssetTable({
  assets,
  subfolders = [],
  folders,
  flat,
  variantLanguage,
  selectedAssetId,
  onOpenFolder,
  onRowClick,
  renderActions,
  selection,
  onSelectionChange,
  dnd,
  'aria-label': ariaLabel,
}: Props) {
  const selectable = Boolean(selection && onSelectionChange)
  const selected = selection ?? noSelection
  const columns = (flat ? 5 : 4) + (selectable ? 1 : 0)
  const selectedHere = assets.filter((asset) => selected.has(asset.id)).length

  function toggle(ids: string[], on: boolean) {
    const next = new Set(selected)
    for (const id of ids) {
      if (on) {
        next.add(id)
      } else {
        next.delete(id)
      }
    }
    onSelectionChange?.(next)
  }

  return (
    <Table.ScrollContainer minWidth={560}>
      <Table highlightOnHover aria-label={ariaLabel} verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            {selectable && (
              <Table.Th w={1}>
                <Checkbox
                  aria-label="Выбрать все файлы"
                  checked={assets.length > 0 && selectedHere === assets.length}
                  indeterminate={selectedHere > 0 && selectedHere < assets.length}
                  disabled={assets.length === 0}
                  onChange={(event) =>
                    toggle(
                      assets.map((asset) => asset.id),
                      event.currentTarget.checked,
                    )
                  }
                />
              </Table.Th>
            )}
            <Table.Th>Название</Table.Th>
            <Table.Th>Язык</Table.Th>
            <Table.Th>Источник</Table.Th>
            {flat && <Table.Th>Папка</Table.Th>}
            <Table.Th w={1} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {subfolders.map((folder) => {
            const target = { key: folder.id, folderId: folder.id, accepts: 'both' as const }

            return (
              <Table.Tr
                key={`folder-${folder.id}`}
                {...(dnd?.enabled ? { ...dnd.dropProps(target), ...dnd.folderDragProps(folder) } : {})}
                data-drop-target={dnd?.isOver(target) ? 'active' : undefined}
                style={
                  dnd?.isOver(target)
                    ? { outline: '2px dashed var(--mantine-color-blue-filled)', outlineOffset: -2 }
                    : undefined
                }
              >
                <Table.Td colSpan={columns}>
                  <UnstyledButton
                    onClick={() => onOpenFolder?.(folder.id)}
                    aria-label={`Открыть папку ${folder.name}`}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <IconFolder size={18} />
                      <Text fw={500}>{folder.name}</Text>
                    </Group>
                  </UnstyledButton>
                </Table.Td>
              </Table.Tr>
            )
          })}
          {assets.map((asset) => {
            const otherLanguage = Boolean(variantLanguage) && asset.languageCode !== variantLanguage

            return (
              <Table.Tr
                key={asset.id}
                bg={asset.id === selectedAssetId ? 'var(--mantine-color-blue-light)' : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
                onClick={onRowClick ? () => onRowClick(asset) : undefined}
                aria-selected={asset.id === selectedAssetId ? true : undefined}
                {...(dnd?.enabled ? dnd.assetDragProps(asset, selected) : {})}
              >
                {selectable && (
                  <Table.Td>
                    <Checkbox
                      aria-label={`Выбрать ${asset.title}`}
                      checked={selected.has(asset.id)}
                      onChange={(event) => toggle([asset.id], event.currentTarget.checked)}
                    />
                  </Table.Td>
                )}
                <Table.Td>
                  <Stack gap={0}>
                    <Group gap={4} wrap="nowrap">
                      {dnd?.enabled && (
                        <IconGripVertical
                          size={14}
                          aria-hidden
                          style={{ cursor: 'grab', color: 'var(--mantine-color-dimmed)', flexShrink: 0 }}
                        />
                      )}
                      <Text fw={500}>{asset.title}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {asset.name}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Badge variant="light" color="gray">
                      {asset.languageCode}
                    </Badge>
                    {otherLanguage && (
                      <Badge variant="light" color="warning">
                        другой язык
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={asset.source === 'generated' ? 'info' : 'gray'}>
                    {sourceLabels[asset.source]}
                  </Badge>
                </Table.Td>
                {flat && (
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {folderPath(folders, asset.folderId)}
                    </Text>
                  </Table.Td>
                )}
                <Table.Td>
                  <Group
                    gap="xs"
                    wrap="nowrap"
                    justify="flex-end"
                    // Row click picks the asset; buttons in the row must not.
                    onClick={(event) => event.stopPropagation()}
                  >
                    <AudioPreviewButton
                      audioAssetId={asset.id}
                      label={`Прослушать ${asset.title}`}
                    />
                    {renderActions?.(asset)}
                  </Group>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
