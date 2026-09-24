import { useState, type DragEvent } from 'react'

import { canMoveFolder } from '../model/folderTree'
import type { AudioAsset, AudioFolder } from '../model/types'

type Dragging = { kind: 'assets'; ids: string[] } | { kind: 'folder'; id: string }

/**
 * A place something can be dropped on. `folderId` is where the dragged thing ends
 * up (null = «Без папки» for files, the top level for folders); `accepts` limits
 * what the place takes — «Без папки» holds only files, «Все файлы» only folders.
 */
export type DropTarget = {
  key: string
  folderId: string | null
  accepts: 'assets' | 'folders' | 'both'
}

type Options = {
  folders: AudioFolder[]
  assets: AudioAsset[]
  onMoveAssets?: (ids: string[], folderId: string | null) => void
  onMoveFolder?: (folder: AudioFolder, parentId: string | null) => void
}

// Firefox starts a drag only when some data is set; the payload itself travels
// in React state, because dragover handlers cannot read it.
const DRAG_TYPE = 'text/plain'

/**
 * Drag and drop of the audio library screen (task 031): files (one, or every
 * selected one) and folders onto folders of the tree or subfolder rows. Only
 * valid targets react, so a drop always means a move the server accepts.
 */
export function useLibraryDnd({ folders, assets, onMoveAssets, onMoveFolder }: Options) {
  const [dragging, setDragging] = useState<Dragging | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  function canDrop(target: DropTarget): boolean {
    if (!dragging) return false
    if (dragging.kind === 'assets') {
      if (target.accepts === 'folders' || !onMoveAssets) return false
      const moved = new Set(dragging.ids)

      return assets.some((asset) => moved.has(asset.id) && asset.folderId !== target.folderId)
    }
    if (target.accepts === 'assets' || !onMoveFolder) return false

    return canMoveFolder(folders, dragging.id, target.folderId)
  }

  function start(event: DragEvent, payload: Dragging, label: string) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(DRAG_TYPE, label)
    setDragging(payload)
  }

  function end() {
    setDragging(null)
    setOverKey(null)
  }

  return {
    enabled: Boolean(onMoveAssets || onMoveFolder),
    dragging,
    isOver: (target: DropTarget) => overKey === target.key && canDrop(target),
    overKey,

    /** Props for a file row; a selected row carries the whole selection. */
    assetDragProps: (asset: AudioAsset, selection: Set<string>) =>
      onMoveAssets
        ? {
            draggable: true,
            onDragStart: (event: DragEvent) => {
              // Library order, not click order, so a group move reads predictably.
              const ids = selection.has(asset.id)
                ? assets.filter((item) => selection.has(item.id)).map((item) => item.id)
                : [asset.id]
              start(
                event,
                { kind: 'assets', ids },
                ids.length === 1 ? asset.title : `${ids.length} файлов`,
              )
            },
            onDragEnd: end,
          }
        : {},

    folderDragProps: (folder: AudioFolder) =>
      onMoveFolder
        ? {
            draggable: true,
            onDragStart: (event: DragEvent) => {
              event.stopPropagation()
              start(event, { kind: 'folder', id: folder.id }, folder.name)
            },
            onDragEnd: end,
          }
        : {},

    dropProps: (target: DropTarget) => ({
      onDragOver: (event: DragEvent) => {
        if (!canDrop(target)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (overKey !== target.key) setOverKey(target.key)
      },
      onDragLeave: (event: DragEvent) => {
        const next = event.relatedTarget
        if (next instanceof Node && event.currentTarget.contains(next)) return
        setOverKey((current) => (current === target.key ? null : current))
      },
      onDrop: (event: DragEvent) => {
        if (!dragging || !canDrop(target)) return
        event.preventDefault()
        if (dragging.kind === 'assets') {
          onMoveAssets?.(dragging.ids, target.folderId)
        } else {
          const folder = folders.find((item) => item.id === dragging.id)
          if (folder) onMoveFolder?.(folder, target.folderId)
        }
        end()
      },
    }),
  }
}

export type LibraryDnd = ReturnType<typeof useLibraryDnd>
