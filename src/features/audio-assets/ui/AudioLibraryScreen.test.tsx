import { useState } from 'react'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications, notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { asset, folder } from '../model/testData'
import { ALL_FILES, ALL_LANGUAGES, type LibraryFilters } from '../model/types'
import { AudioLibraryScreen } from './AudioLibraryScreen'

const folders = [folder('dep', 'Вылеты'), folder('su', 'SU 1234', 'dep'), folder('empty', 'Музыка')]
const assets = [
  asset('gate-ru', 'gate a12 ru', { folderId: 'su', name: 'gate-a12-ru.wav' }),
  asset('gong', 'Гонг'),
]

function apiResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: status < 300, data, errors: [] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockApi(options: { failMove?: boolean } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (url.includes('/languages')) {
      return apiResponse([{ code: 'ru', name: 'Русский', nativeName: 'Русский', active: true, sortOrder: 1 }])
    }
    if (url.includes('/audio-folders') && method === 'POST') {
      return apiResponse({ id: 'new', ...JSON.parse(String(init?.body)) }, 201)
    }
    if (url.includes('/audio-folders') && method === 'DELETE') return new Response(null, { status: 204 })
    if (url.includes('/audio-folders/') && method === 'PATCH') {
      return apiResponse({ id: url.split('/').pop(), ...JSON.parse(String(init?.body)) })
    }
    if (url.includes('/audio-folders')) return apiResponse(folders)
    if (url.includes('/audio-assets:move')) {
      const { assetIds, folderId } = JSON.parse(String(init?.body))
      if (options.failMove) return apiResponse(null, 404)

      return apiResponse(
        assets.filter((item) => assetIds.includes(item.id)).map((item) => ({ ...item, folderId })),
      )
    }
    if (url.includes('/audio-assets') && method === 'PATCH') {
      return apiResponse({ ...assets[0], ...JSON.parse(String(init?.body)) })
    }
    if (url.includes('/audio-assets')) return apiResponse(assets)

    return apiResponse(null, 404)
  })
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function Harness({ initialFolder = ALL_FILES }: { initialFolder?: string }) {
  const [filters, setFilters] = useState<LibraryFilters>({
    folder: initialFolder,
    language: ALL_LANGUAGES,
    source: 'all',
    search: '',
  })

  return <AudioLibraryScreen filters={filters} onFiltersChange={setFilters} />
}

function renderScreen(initialFolder?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <Notifications />
        <ModalsProvider>
          <Harness initialFolder={initialFolder} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>,
  )
}

const calls = (fetchMock: ReturnType<typeof mockApi>, method: string, path: string) =>
  fetchMock.mock.calls.filter(
    ([url, init]) => String(url).includes(path) && (init?.method ?? 'GET') === method,
  )

describe('AudioLibraryScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    // The notifications store is global: don't let one test's toast leak into the next.
    notifications.clean()
  })

  it('lists every file with its folder path', async () => {
    mockApi()
    renderScreen()

    const files = await screen.findByRole('table', { name: 'Файлы' })
    expect(within(files).getByText('gate a12 ru')).toBeInTheDocument()
    expect(within(files).getByText('gate-a12-ru.wav')).toBeInTheDocument()
    expect(within(files).getByText('Вылеты / SU 1234')).toBeInTheDocument()
  })

  it('renames a file and moves it to another folder', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Действия с файлом gate a12 ru' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить аудиофайл' })
    const title = within(dialog).getByRole('textbox', { name: /Название/ })
    await user.clear(title)
    await user.type(title, 'Выход A12')
    await user.click(within(dialog).getByRole('combobox', { name: 'Папка' }))
    await user.click(await screen.findByRole('option', { name: 'Без папки' }))
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(calls(fetchMock, 'PATCH', '/audio-assets/gate-ru')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'PATCH', '/audio-assets/gate-ru')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ title: 'Выход A12', folderId: null })
  })

  it('creates a folder inside the open folder', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen('dep')

    await user.click(await screen.findByRole('button', { name: 'Новая папка' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новая папка' })
    await user.type(within(dialog).getByRole('textbox', { name: /Название/ }), 'U6 2601')
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(calls(fetchMock, 'POST', '/audio-folders')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'POST', '/audio-folders')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'U6 2601', parentId: 'dep' })
  })

  it('offers to delete only an empty folder, right from the tree', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Меню папки Вылеты' }))
    expect(
      await screen.findByRole('menuitem', { name: /Удалить \(сначала уберите файлы и подпапки\)/ }),
    ).toBeDisabled()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Меню папки Музыка' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Удалить' }))
    await user.click(await screen.findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(calls(fetchMock, 'DELETE', '/audio-folders/empty')).toHaveLength(1))
  })

  it('creates a subfolder from the tree menu', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Меню папки Музыка' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Новая подпапка' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новая папка' })
    await user.type(within(dialog).getByRole('textbox', { name: /Название/ }), 'Фон')
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(calls(fetchMock, 'POST', '/audio-folders')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'POST', '/audio-folders')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'Фон', parentId: 'empty' })
  })

  it('moves the selected files with «Переместить в…»', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('checkbox', { name: 'Выбрать все файлы' }))
    expect(screen.getByText(/Выбрано: 2 файла/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Переместить в…' }))
    const dialog = await screen.findByRole('dialog', { name: 'Переместить' })
    await user.click(within(dialog).getByRole('combobox', { name: 'Куда' }))
    await user.click(await screen.findByRole('option', { name: 'Музыка' }))
    await user.click(within(dialog).getByRole('button', { name: 'Переместить' }))

    await waitFor(() => expect(calls(fetchMock, 'POST', '/audio-assets:move')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'POST', '/audio-assets:move')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ assetIds: ['gate-ru', 'gong'], folderId: 'empty' })
    await waitFor(() => expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument())
  })

  it('drags a file onto a folder of the tree', async () => {
    const fetchMock = mockApi()
    renderScreen()

    const row = (await screen.findByText('Гонг')).closest('tr') as HTMLElement
    const target = dropTargetOf(screen.getByRole('button', { name: /^Музыка/ }))

    drag(row, target)

    await waitFor(() => expect(calls(fetchMock, 'POST', '/audio-assets:move')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'POST', '/audio-assets:move')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ assetIds: ['gong'], folderId: 'empty' })
  })

  it('drags a selected file together with the rest of the selection', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('checkbox', { name: 'Выбрать все файлы' }))
    drag(
      screen.getByText('Гонг').closest('tr') as HTMLElement,
      dropTargetOf(screen.getByRole('button', { name: /^Музыка/ })),
    )

    await waitFor(() => expect(calls(fetchMock, 'POST', '/audio-assets:move')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'POST', '/audio-assets:move')[0]
    expect(JSON.parse(String(init?.body)).assetIds).toEqual(['gate-ru', 'gong'])
  })

  it('drags a folder into another folder but never into its own subfolder', async () => {
    const fetchMock = mockApi()
    const user = userEvent.setup()
    renderScreen('dep')

    await screen.findByRole('table', { name: 'Файлы' })
    const departures = dropTargetOf(treeFolder('Вылеты'))
    await user.click(screen.getByLabelText('Развернуть Вылеты'))
    const flight = dropTargetOf(treeFolder('SU 1234'))

    drag(departures, flight)
    expect(calls(fetchMock, 'PATCH', '/audio-folders/')).toHaveLength(0)

    drag(departures, dropTargetOf(treeFolder('Музыка')))
    await waitFor(() => expect(calls(fetchMock, 'PATCH', '/audio-folders/dep')).toHaveLength(1))
    const [, init] = calls(fetchMock, 'PATCH', '/audio-folders/dep')[0]
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'Вылеты', parentId: 'empty' })
  })

  it('puts a file back and says so when the server refuses the move', async () => {
    mockApi({ failMove: true })
    renderScreen()

    drag(
      (await screen.findByText('Гонг')).closest('tr') as HTMLElement,
      dropTargetOf(screen.getByRole('button', { name: /^Музыка/ })),
    )

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    const files = screen.getByRole('table', { name: 'Файлы' })
    expect(within(files).getByText('Гонг')).toBeInTheDocument()
  })
})

/** A folder's button in the tree (its name may follow a chevron's label). */
function treeFolder(name: string): HTMLElement {
  const tree = screen.getByRole('navigation', { name: 'Папки' })
  const button = within(tree)
    .getAllByRole('button')
    .find((element) => element.tagName === 'BUTTON' && element.textContent?.startsWith(name))
  if (!button) throw new Error(`Folder "${name}" is not in the tree.`)

  return button
}

/** The tree row wrapping a folder button is where drops land. */
function dropTargetOf(button: HTMLElement): HTMLElement {
  return button.parentElement as HTMLElement
}

function drag(source: HTMLElement, target: HTMLElement) {
  const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
  fireEvent.dragStart(source, { dataTransfer })
  fireEvent.dragOver(target, { dataTransfer })
  fireEvent.drop(target, { dataTransfer })
  fireEvent.dragEnd(source, { dataTransfer })
}
