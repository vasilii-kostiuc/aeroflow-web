import { useEffect, useState, type ReactNode } from 'react'

import { ActionIcon, Badge, Box, NavLink, Stack } from '@mantine/core'
import {
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFolderOff,
  IconLibrary,
} from '@tabler/icons-react'

import type { DropTarget, LibraryDnd } from '../hooks/useLibraryDnd'
import { buildFolderTree, folderAncestry, type FolderNode } from '../model/folderTree'
import { ALL_FILES, NO_FOLDER, type AudioFolder, type FolderSelection } from '../model/types'

type Props = {
  folders: AudioFolder[]
  /** Asset count per selection (whole subtree), with the current filters applied. */
  counts: Map<FolderSelection, number>
  selected: FolderSelection
  onSelect: (selection: FolderSelection) => void
  /** Per-folder actions (library screen only). */
  renderFolderMenu?: (folder: AudioFolder) => ReactNode
  dnd?: LibraryDnd
}

/** How long a dragged item hovers over a collapsed folder before it opens. */
const EXPAND_ON_HOVER_MS = 600

const ALL_FILES_TARGET: DropTarget = { key: ALL_FILES, folderId: null, accepts: 'folders' }
const NO_FOLDER_TARGET: DropTarget = { key: NO_FOLDER, folderId: null, accepts: 'assets' }
const folderTarget = (id: string): DropTarget => ({ key: id, folderId: id, accepts: 'both' })

/**
 * Folder tree of the audio library: «Все файлы» on top, the folders, «Без папки»
 * at the bottom. The branch leading to the selected folder is always expanded;
 * other branches toggle with their chevron. On the library screen folders also
 * carry a menu and take part in drag and drop.
 */
export function FolderTree({ folders, counts, selected, onSelect, renderFolderMenu, dnd }: Props) {
  const tree = buildFolderTree(folders)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const forcedOpen = new Set(
    selected !== ALL_FILES && selected !== NO_FOLDER
      ? folderAncestry(folders, selected)
          .slice(0, -1)
          .map((folder) => folder.id)
      : [],
  )

  const isOpen = (id: string) => expanded.has(id) || forcedOpen.has(id)
  const hoveredFolder = dnd?.dragging ? dnd.overKey : null

  // Dragging over a collapsed folder opens it, so nested folders can be reached.
  useEffect(() => {
    if (!hoveredFolder || hoveredFolder === ALL_FILES || hoveredFolder === NO_FOLDER) return
    const timer = setTimeout(
      () => setExpanded((current) => new Set(current).add(hoveredFolder)),
      EXPAND_ON_HOVER_MS,
    )

    return () => clearTimeout(timer)
  }, [hoveredFolder])

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (isOpen(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const count = (selection: FolderSelection) => {
    const value = counts.get(selection) ?? 0

    return (
      <Badge size="sm" variant="light" color={value === 0 ? 'gray' : 'blue'}>
        {value}
      </Badge>
    )
  }

  const dropArea = (target: DropTarget, children: ReactNode, extra: object = {}) => (
    <Box
      {...extra}
      {...(dnd?.enabled ? dnd.dropProps(target) : {})}
      data-drop-target={dnd?.isOver(target) ? 'active' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 'var(--mantine-radius-sm)',
        outline: dnd?.isOver(target) ? '2px dashed var(--mantine-color-blue-filled)' : undefined,
        outlineOffset: -2,
      }}
    >
      {children}
    </Box>
  )

  const renderNode = (node: FolderNode) => {
    const open = isOpen(node.id)
    const empty = (counts.get(node.id) ?? 0) === 0

    return (
      <div key={node.id}>
        {dropArea(
          folderTarget(node.id),
          <>
            <NavLink
              component="button"
              type="button"
              label={node.name}
              active={selected === node.id}
              c={empty && selected !== node.id ? 'dimmed' : undefined}
              style={{
                flex: 1,
                minWidth: 0,
                paddingLeft: `calc(var(--mantine-spacing-xs) + ${node.depth} * 1rem)`,
              }}
              leftSection={
                node.children.length > 0 ? (
                  <ActionIcon
                    component="span"
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={open ? `Свернуть ${node.name}` : `Развернуть ${node.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggle(node.id)
                    }}
                  >
                    {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </ActionIcon>
                ) : selected === node.id ? (
                  <IconFolderOpen size={16} />
                ) : (
                  <IconFolder size={16} />
                )
              }
              rightSection={count(node.id)}
              onClick={() => {
                onSelect(node.id)
                if (node.children.length > 0 && !open) toggle(node.id)
              }}
            />
            {renderFolderMenu?.(node)}
          </>,
          dnd?.folderDragProps(node),
        )}
        {open && node.children.map(renderNode)}
      </div>
    )
  }

  return (
    <Stack gap={0} aria-label="Папки" role="navigation">
      {dropArea(
        ALL_FILES_TARGET,
        <NavLink
          component="button"
          type="button"
          label="Все файлы"
          leftSection={<IconLibrary size={16} />}
          active={selected === ALL_FILES}
          rightSection={count(ALL_FILES)}
          onClick={() => onSelect(ALL_FILES)}
        />,
      )}
      {tree.map(renderNode)}
      {dropArea(
        NO_FOLDER_TARGET,
        <NavLink
          component="button"
          type="button"
          label="Без папки"
          leftSection={<IconFolderOff size={16} />}
          active={selected === NO_FOLDER}
          rightSection={count(NO_FOLDER)}
          onClick={() => onSelect(NO_FOLDER)}
        />,
      )}
    </Stack>
  )
}
