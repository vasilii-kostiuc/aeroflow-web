import { describe, expect, it } from 'vitest'

import {
  buildFolderTree,
  canMoveFolder,
  countAssets,
  existingSelection,
  folderOptions,
  folderPath,
  subtreeHeight,
  subtreeIds,
} from './folderTree'
import { asset, folder } from './testData'
import { ALL_FILES, NO_FOLDER } from './types'

const folders = [
  folder('dep', 'Вылеты'),
  folder('su', 'SU 1234', 'dep'),
  folder('u6', 'U6 2601', 'dep'),
  folder('arr', 'Прибытие'),
  folder('gate', 'Выходы', 'su'),
]

describe('folderTree', () => {
  it('builds a sorted tree with depths', () => {
    const tree = buildFolderTree(folders)

    expect(tree.map((node) => node.name)).toEqual(['Вылеты', 'Прибытие'])
    expect(tree[0].children.map((node) => node.name)).toEqual(['SU 1234', 'U6 2601'])
    expect(tree[0].children[0].children[0]).toMatchObject({ name: 'Выходы', depth: 2 })
  })

  it('renders folder paths, the root included', () => {
    expect(folderPath(folders, 'gate')).toBe('Вылеты / SU 1234 / Выходы')
    expect(folderPath(folders, null)).toBe('Без папки')
    expect(folderOptions(folders).map((option) => option.label)).toEqual([
      'Вылеты',
      'Вылеты / SU 1234',
      'Вылеты / SU 1234 / Выходы',
      'Вылеты / U6 2601',
      'Прибытие',
    ])
  })

  it('collects a subtree and excludes it from folder options', () => {
    expect([...subtreeIds(folders, 'su')].sort()).toEqual(['gate', 'su'])
    expect(folderOptions(folders, subtreeIds(folders, 'su')).map((option) => option.value)).toEqual([
      'dep',
      'u6',
      'arr',
    ])
  })

  it('counts assets through the whole subtree; unknown folders count as the root', () => {
    const counts = countAssets(
      [
        asset('a', 'A', { folderId: 'gate' }),
        asset('b', 'B', { folderId: 'u6' }),
        asset('c', 'C'),
        asset('d', 'D', { folderId: 'deleted-folder' }),
      ],
      folders,
    )

    expect(counts.get(ALL_FILES)).toBe(4)
    expect(counts.get('dep')).toBe(2)
    expect(counts.get('su')).toBe(1)
    expect(counts.get('arr')).toBeUndefined()
    expect(counts.get(NO_FOLDER)).toBe(2)
  })

  it('drops a remembered folder that no longer exists', () => {
    expect(existingSelection('su', folders)).toBe('su')
    expect(existingSelection('gone', folders)).toBeUndefined()
    expect(existingSelection(NO_FOLDER, folders)).toBe(NO_FOLDER)
    expect(existingSelection(undefined, folders)).toBeUndefined()
  })

  it('offers only valid places to move a folder to', () => {
    expect(subtreeHeight(folders, 'dep')).toBe(3)
    expect(canMoveFolder(folders, 'su', 'arr')).toBe(true)
    expect(canMoveFolder(folders, 'su', null)).toBe(true)
    // Where it already is, into itself, into a subfolder.
    expect(canMoveFolder(folders, 'su', 'dep')).toBe(false)
    expect(canMoveFolder(folders, 'su', 'su')).toBe(false)
    expect(canMoveFolder(folders, 'dep', 'gate')).toBe(false)
    // «Вылеты» is 3 levels deep; under «Прибытие» it would reach 4 — the limit.
    expect(canMoveFolder(folders, 'dep', 'arr')).toBe(true)
    // Under a level-2 folder it would reach 5.
    expect(canMoveFolder([...folders, folder('y', 'Y', 'arr')], 'dep', 'y')).toBe(false)
  })
})
