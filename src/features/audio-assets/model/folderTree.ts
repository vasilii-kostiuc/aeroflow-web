import {
  ALL_FILES,
  NO_FOLDER,
  type AudioAsset,
  type AudioFolder,
  type FolderSelection,
} from './types'

export type FolderNode = AudioFolder & { children: FolderNode[]; depth: number }

/** Same limit as the server (AudioFolder::MAX_DEPTH): a top-level folder is level 1. */
export const MAX_FOLDER_DEPTH = 4

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })

/** Assembles the flat folder list into a sorted tree. Orphans surface at the top level. */
export function buildFolderTree(folders: AudioFolder[]): FolderNode[] {
  const ids = new Set(folders.map((folder) => folder.id))
  const children = new Map<string | null, AudioFolder[]>()
  for (const folder of folders) {
    const parent = folder.parentId !== null && ids.has(folder.parentId) ? folder.parentId : null
    children.set(parent, [...(children.get(parent) ?? []), folder])
  }

  const build = (parentId: string | null, depth: number): FolderNode[] =>
    [...(children.get(parentId) ?? [])]
      .sort(byName)
      .map((folder) => ({ ...folder, depth, children: build(folder.id, depth + 1) }))

  return build(null, 0)
}

/** Chain from the top level down to the folder itself. */
export function folderAncestry(folders: AudioFolder[], folderId: string): AudioFolder[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const chain: AudioFolder[] = []
  let cursor = byId.get(folderId)
  while (cursor && !chain.includes(cursor)) {
    chain.unshift(cursor)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }

  return chain
}

/** «Вылеты / SU 1234», or «Без папки» for the root. */
export function folderPath(folders: AudioFolder[], folderId: string | null): string {
  if (folderId === null) return 'Без папки'
  const chain = folderAncestry(folders, folderId)

  return chain.length ? chain.map((folder) => folder.name).join(' / ') : 'Без папки'
}

/** The folder and everything below it. */
export function subtreeIds(folders: AudioFolder[], folderId: string): Set<string> {
  const ids = new Set([folderId])
  let grew = true
  while (grew) {
    grew = false
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id)
        grew = true
      }
    }
  }

  return ids
}

/** Folder options for a select, as full paths, sorted like the tree. */
export function folderOptions(
  folders: AudioFolder[],
  exclude: Set<string> = new Set(),
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const walk = (nodes: FolderNode[]) => {
    for (const node of nodes) {
      if (exclude.has(node.id)) continue
      options.push({ value: node.id, label: folderPath(folders, node.id) })
      walk(node.children)
    }
  }
  walk(buildFolderTree(folders))

  return options
}

/**
 * The folder an asset effectively lives in: an id that no longer exists counts as
 * the root, so no asset ever disappears from the tree.
 */
export function effectiveFolderId(asset: AudioAsset, folders: AudioFolder[]): string | null {
  return asset.folderId !== null && folders.some((folder) => folder.id === asset.folderId)
    ? asset.folderId
    : null
}

/** Asset count per folder id (whole subtree), plus the root and «Все файлы». */
export function countAssets(
  assets: AudioAsset[],
  folders: AudioFolder[],
): Map<FolderSelection, number> {
  const parents = new Map(folders.map((folder) => [folder.id, folder.parentId]))
  const counts = new Map<FolderSelection, number>([
    [ALL_FILES, assets.length],
    [NO_FOLDER, 0],
  ])
  for (const asset of assets) {
    let cursor = effectiveFolderId(asset, folders)
    if (cursor === null) {
      counts.set(NO_FOLDER, (counts.get(NO_FOLDER) ?? 0) + 1)
      continue
    }
    const seen = new Set<string>()
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor)
      counts.set(cursor, (counts.get(cursor) ?? 0) + 1)
      cursor = parents.get(cursor) ?? null
    }
  }

  return counts
}

/** Resolve a remembered selection against the current tree; unknown folders fall back to «Все файлы». */
export function existingSelection(
  selection: FolderSelection | undefined,
  folders: AudioFolder[],
): FolderSelection | undefined {
  if (selection === undefined) return undefined
  if (selection === ALL_FILES || selection === NO_FOLDER) return selection

  return folders.some((folder) => folder.id === selection) ? selection : undefined
}

/** Levels in the subtree rooted at the folder, the folder itself included. */
export function subtreeHeight(folders: AudioFolder[], folderId: string): number {
  const children = folders.filter((folder) => folder.parentId === folderId)

  return 1 + Math.max(0, ...children.map((child) => subtreeHeight(folders, child.id)))
}

/**
 * Whether a folder can move under `parentId` (null = top level): not into itself
 * or a subfolder, not deeper than the limit, and not where it already is. The
 * server enforces the same rules; the UI uses this to offer only valid targets.
 */
export function canMoveFolder(
  folders: AudioFolder[],
  folderId: string,
  parentId: string | null,
): boolean {
  const moved = folders.find((folder) => folder.id === folderId)
  if (!moved || moved.parentId === parentId) return false
  if (parentId === null) return true
  if (subtreeIds(folders, folderId).has(parentId)) return false

  return folderAncestry(folders, parentId).length + subtreeHeight(folders, folderId) <= MAX_FOLDER_DEPTH
}
