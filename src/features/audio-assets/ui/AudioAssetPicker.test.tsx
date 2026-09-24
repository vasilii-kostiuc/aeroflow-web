import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLibraryPreferences } from '../model/libraryPreferences'
import { asset, folder } from '../model/testData'
import { AudioAssetPicker } from './AudioAssetPicker'

const mocks = vi.hoisted(() => ({
  useAudioAssets: vi.fn(),
  useAudioFolders: vi.fn(),
  createFolder: vi.fn(),
}))

vi.mock('../hooks/useAudioAssets', () => ({
  useAudioAssets: mocks.useAudioAssets,
  useUploadAudioAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../hooks/useAudioFolders', () => ({
  useAudioFolders: mocks.useAudioFolders,
  useCreateAudioFolder: () => ({ mutateAsync: mocks.createFolder, isPending: false }),
  useUpdateAudioFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/features/languages/hooks/useLanguages', () => ({
  useLanguages: () => ({
    data: [
      { code: 'ru', name: 'Русский', nativeName: 'Русский', active: true, sortOrder: 1 },
      { code: 'en', name: 'English', nativeName: 'English', active: true, sortOrder: 2 },
    ],
    isLoading: false,
  }),
}))

const folders = [
  folder('dep', 'Вылеты'),
  folder('su', 'SU 1234', 'dep'),
  folder('arr', 'Прибытие'),
]

const assets = [
  asset('gate-ru', 'Выход A12', { folderId: 'su' }),
  asset('gate-en', 'Gate A12', { folderId: 'su', languageCode: 'en' }),
  asset('landed', 'Рейс прибыл', { folderId: 'arr' }),
  asset('gong', 'Гонг'),
]

function renderPicker(props: { value?: string | null; placeKey?: string; onChange?: () => void } = {}) {
  const onChange = props.onChange ?? vi.fn()
  render(
    <MantineProvider env="test">
      <AudioAssetPicker
        label="Аудиофайл"
        value={props.value ?? null}
        onChange={onChange}
        languageCode="ru"
        placeKey={props.placeKey ?? 'segment:boarding_invitation'}
      />
    </MantineProvider>,
  )

  return { onChange }
}

async function openPicker() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Выбрать: Аудиофайл' }))

  return { user, dialog: await screen.findByRole('dialog', { name: 'Выбор аудиофайла' }) }
}

describe('AudioAssetPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLibraryPreferences.setState({ byUser: {} })
    mocks.useAudioAssets.mockReturnValue({ data: assets, isLoading: false })
    mocks.useAudioFolders.mockReturnValue({ data: folders, isLoading: false })
  })

  it('shows the chosen asset by title', () => {
    renderPicker({ value: 'gate-ru' })

    expect(screen.getByText('Выход A12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выбрать: Аудиофайл' })).toHaveTextContent('Изменить…')
  })

  it('flags a chosen asset that is no longer in the library', () => {
    renderPicker({ value: 'deleted' })

    expect(screen.getByText('Файл недоступен')).toBeInTheDocument()
  })

  it('opens in the folder of the chosen asset, with its row selected', async () => {
    renderPicker({ value: 'gate-ru' })
    const { dialog } = await openPicker()

    const files = within(dialog).getByRole('table', { name: 'Файлы' })
    expect(within(files).getByText('Выход A12').closest('tr')).toHaveAttribute('aria-selected', 'true')
    // Variant language by default: the English file of the same folder is hidden.
    expect(within(files).queryByText('Gate A12')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Рейс прибыл')).not.toBeInTheDocument()
  })

  it('opens in the folder last picked from at this place, else in «Все файлы»', async () => {
    useLibraryPreferences
      .getState()
      .rememberPick('anonymous', 'segment:arrival', 'landed', 'arr')

    renderPicker({ placeKey: 'segment:arrival' })
    const { dialog } = await openPicker()
    const files = within(dialog).getByRole('table', { name: 'Файлы' })
    expect(within(files).getByText('Рейс прибыл')).toBeInTheDocument()
    expect(within(files).queryByText('Гонг')).not.toBeInTheDocument()
  })

  it('falls back to «Все файлы» when the remembered folder is gone', async () => {
    useLibraryPreferences.getState().rememberPick('anonymous', 'segment:arrival', 'landed', 'deleted')

    renderPicker({ placeKey: 'segment:arrival' })
    const { dialog } = await openPicker()
    const files = within(dialog).getByRole('table', { name: 'Файлы' })
    expect(within(files).getByText('Гонг')).toBeInTheDocument()
    expect(within(files).getByText('Рейс прибыл')).toBeInTheDocument()
  })

  it('navigates the tree and counts assets with the filters applied', async () => {
    renderPicker()
    const { user, dialog } = await openPicker()
    const tree = within(dialog).getByRole('navigation', { name: 'Папки' })

    // «Вылеты» holds one Russian file (in SU 1234); the English one is filtered out.
    const departures = within(tree).getByRole('button', { name: /Вылеты/ })
    expect(departures).toHaveTextContent('1')

    await user.click(departures)
    // A folder lists its subfolders before its own files.
    await user.click(within(dialog).getByRole('button', { name: 'Открыть папку SU 1234' }))
    expect(within(dialog).getByText('Выход A12')).toBeInTheDocument()
  })

  it('searches the whole library and shows where each file lives', async () => {
    renderPicker({ value: 'gong' })
    const { user, dialog } = await openPicker()

    await user.type(within(dialog).getByRole('textbox', { name: 'Поиск файла' }), 'a12')

    expect(within(dialog).getByText('Поиск по всей библиотеке')).toBeInTheDocument()
    const files = within(dialog).getByRole('table', { name: 'Файлы' })
    expect(within(files).getByText('Выход A12')).toBeInTheDocument()
    expect(within(files).getByText('Вылеты / SU 1234')).toBeInTheDocument()
  })

  it('shows other languages on request, flagged', async () => {
    renderPicker({ value: 'gate-ru' })
    const { user, dialog } = await openPicker()

    await user.click(within(dialog).getByText('Все языки'))

    const row = within(dialog).getByText('Gate A12').closest('tr') as HTMLElement
    expect(within(row).getByText('другой язык')).toBeInTheDocument()
  })

  it('picks by row click, remembers it and lists it under recent picks', async () => {
    const { onChange } = renderPicker({ placeKey: 'preset:emergency' })
    const { user, dialog } = await openPicker()

    await user.click(within(dialog).getByText('Рейс прибыл'))

    expect(onChange).toHaveBeenCalledWith('landed')
    const preferences = useLibraryPreferences.getState().byUser.anonymous
    expect(preferences.recent).toEqual(['landed'])
    expect(preferences.lastFolderByPlace['preset:emergency']).toBe('arr')
  })

  it('shows recent picks across folders but only in the filtered language', async () => {
    const { rememberPick } = useLibraryPreferences.getState()
    rememberPick('anonymous', 'other', 'gate-en', 'su')
    rememberPick('anonymous', 'other', 'gong', 'root')

    renderPicker({ placeKey: 'segment:arrival' })
    const { dialog } = await openPicker()

    const recent = within(dialog).getByRole('table', { name: 'Недавно использованные' })
    expect(within(recent).getByText('Гонг')).toBeInTheDocument()
    expect(within(recent).queryByText('Gate A12')).not.toBeInTheDocument()
  })

  it('creates a folder inside the open one without leaving the picker', async () => {
    mocks.createFolder.mockResolvedValue(folder('new', 'SU 9999', 'dep'))
    renderPicker({ value: 'gate-ru' })
    const { user, dialog } = await openPicker()

    await user.click(within(dialog).getByRole('button', { name: 'Новая папка' }))
    const folderDialog = await screen.findByRole('dialog', { name: 'Новая папка' })
    await user.type(within(folderDialog).getByRole('textbox', { name: /Название/ }), 'SU 9999')
    await user.click(within(folderDialog).getByRole('button', { name: 'Сохранить' }))

    // The picker was open in SU 1234 (the chosen asset's folder).
    expect(mocks.createFolder).toHaveBeenCalledWith({ name: 'SU 9999', parentId: 'su' })
    expect(screen.getByRole('dialog', { name: 'Выбор аудиофайла' })).toBeInTheDocument()
  })
})
