import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FlightDefinition } from '../../model/types'
import { FlightAnnouncementConfigsPanel } from './FlightAnnouncementConfigsPanel'

const flight: FlightDefinition = {
  id: '01900000-0000-7000-8000-000000000001',
  flightNumber: '5F123',
  direction: 'departure',
  originAirportCode: 'RMO',
  destinationAirportCode: 'FCO',
  active: true,
  createdAt: '2026-06-22T10:00:00+00:00',
  updatedAt: '2026-06-22T10:00:00+00:00',
}

const languages = [
  {
    code: 'ro-MD',
    name: 'Romanian (Moldova)',
    nativeName: 'Romana',
    active: true,
    sortOrder: 1,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    active: true,
    sortOrder: 2,
  },
]

const audioAssets = [
  {
    id: '01900000-0000-7000-8000-000000000004',
    name: 'opening-ro.wav',
    languageCode: 'ro-MD',
    active: true,
    mimeType: 'audio/x-wav',
    sizeBytes: 44,
  },
]

function apiResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: status >= 200 && status < 300,
      data,
      errors: [],
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

function config(overrides: Record<string, unknown> = {}) {
  return {
    id: '01900000-0000-7000-8000-000000000002',
    flightDefinitionId: flight.id,
    announcementType: 'check_in_opening',
    enabled: true,
    repeatEveryMinutes: null,
    isValidForDispatcher: true,
    validationErrors: [],
    variants: [
      {
        id: '01900000-0000-7000-8000-000000000003',
        languageCode: 'ro-MD',
        sortOrder: 1,
        segments: [
          {
            id: '01900000-0000-7000-8000-000000000013',
            sortOrder: 1,
            type: 'text',
            audioAssetId: null,
            slot: null,
            durationMs: null,
            text: 'Text inițial',
          },
        ],
        enabled: true,
        createdAt: '2026-06-22T10:00:00+00:00',
        updatedAt: '2026-06-22T10:00:00+00:00',
      },
    ],
    createdAt: '2026-06-22T10:00:00+00:00',
    updatedAt: '2026-06-22T10:00:00+00:00',
    ...overrides,
  }
}

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [
      { path: '/', element: <FlightAnnouncementConfigsPanel flightDefinition={flight} /> },
      { path: '/elsewhere', element: <p>Другая страница</p> },
    ],
    { initialEntries: ['/'] },
  )

  const result = render(
    <MantineProvider env="test">
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>,
  )

  return { ...result, router }
}


const enVariant = {
  id: '01900000-0000-7000-8000-000000000006',
  languageCode: 'en',
  sortOrder: 2,
  segments: [
    {
      id: '01900000-0000-7000-8000-000000000016',
      sortOrder: 1,
      type: 'text',
      audioAssetId: null,
      slot: null,
      durationMs: null,
      text: 'Initial text',
    },
  ],
  enabled: true,
  createdAt: '2026-06-22T10:00:00+00:00',
  updatedAt: '2026-06-22T10:00:00+00:00',
}

function twoLanguageConfig() {
  const base = config()
  return config({ variants: [base.variants[0], enVariant] })
}

function mockPanelApi(configs: unknown[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/languages')) return apiResponse(languages)
    if (url.includes('/audio-assets') && init?.method === 'POST') {
      return apiResponse({
        id: '01900000-0000-7000-8000-000000000005',
        name: 'replacement.wav',
        languageCode: 'ro-MD',
        active: true,
        mimeType: 'audio/x-wav',
        sizeBytes: 44,
      })
    }
    if (url.includes('/audio-assets')) return apiResponse(audioAssets)
    if (init?.method === 'POST') return apiResponse(config())
    if (init?.method === 'PATCH') return apiResponse(config())

    return apiResponse(configs)
  })
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

describe('FlightAnnouncementConfigsPanel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders announcement type tabs and creates a missing config from an empty tab', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    expect(await screen.findByRole('tab', { name: /Начало регистрации/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(await screen.findByText('Готово')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Продолжение регистрации/ }))
    expect(
      await screen.findByText(/ещё не настроено/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Настроить' }))

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/announcement-configs') && init?.method === 'POST',
    )
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      announcementType: 'check_in_continuation',
      enabled: true,
      repeatEveryMinutes: 6,
    })
  })

  it('shows variants read-only with a language name and a summary', async () => {
    mockPanelApi([twoLanguageConfig()])

    renderPanel()

    expect(await screen.findByText('Romana · ro-MD')).toBeInTheDocument()
    expect(screen.getByText('English · en')).toBeInTheDocument()
    expect(screen.getByText('Text inițial')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Язык')).not.toBeInTheDocument()
  })

  it('edits one variant through the modal and saves it with a single button', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Изменить' }))
    const save = screen.getByRole('button', { name: 'Сохранить' })
    expect(save).toBeDisabled()

    await user.click(
      screen.getByRole('button', { name: 'Редактировать сегмент 1 (варианта ro-MD)' }),
    )
    const text = await screen.findByLabelText('Текст')
    await user.clear(text)
    await user.type(text, 'Text actualizat')
    await user.click(screen.getByRole('button', { name: 'Сохранить сегмент' }))
    expect(save).toBeEnabled()
    await user.click(save)

    const payload = JSON.parse(String(findVariantPatch(fetchMock)?.[1]?.body))
    expect(payload).toMatchObject({
      languageCode: 'ro-MD',
      sortOrder: 1,
      enabled: true,
      segments: [{ sortOrder: 1, type: 'text', text: 'Text actualizat' }],
    })
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument(),
    )
  })

  it('keeps a single editor open at a time', async () => {
    mockPanelApi([twoLanguageConfig()])
    const user = userEvent.setup()

    renderPanel()

    await screen.findByText('English · en')
    const [editFirst] = screen.getAllByRole('button', { name: 'Изменить' })
    await user.click(editFirst)

    expect(screen.getByRole('button', { name: 'Изменить' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Добавить язык' })).toBeDisabled()
  })

  it('adds, reorders and removes segments inside the editor', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Изменить' }))
    await user.click(screen.getByRole('button', { name: 'Добавить сегмент' }))
    await selectOption('Тип', 'Пауза')
    await user.clear(screen.getByLabelText('Длительность, мс'))
    await user.type(screen.getByLabelText('Длительность, мс'), '700')
    await user.click(screen.getByRole('button', { name: 'Сохранить сегмент' }))
    await user.click(
      screen.getByRole('button', { name: 'Переместить сегмент 2 выше (варианта ro-MD)' }),
    )
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    const payload = JSON.parse(String(findVariantPatch(fetchMock)?.[1]?.body))
    expect(payload.segments).toMatchObject([
      { sortOrder: 1, type: 'pause', durationMs: 700 },
      { sortOrder: 2, type: 'text', text: 'Text inițial' },
    ])
  })

  it('adds a new language with the first language the type does not speak yet', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Добавить язык' }))
    expect(screen.getByText('Новый язык')).toBeInTheDocument()
    expect(screen.getByText('Добавьте хотя бы один сегмент.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Добавить сегмент' }))
    await selectOption('Тип', 'Пауза')
    await user.click(screen.getByRole('button', { name: 'Сохранить сегмент' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    const createVariantCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/variants') && init?.method === 'POST',
    )
    expect(JSON.parse(String(createVariantCall?.[1]?.body))).toMatchObject({
      languageCode: 'en',
      sortOrder: 2,
      enabled: true,
      segments: [{ sortOrder: 1, type: 'pause', durationMs: 500 }],
    })
    await waitFor(() => expect(screen.queryByText('Новый язык')).not.toBeInTheDocument())
  })

  it('cancels an untouched new language without a request or a question', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Добавить язык' }))
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(screen.queryByText('Новый язык')).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.find(
        ([url, init]) => String(url).endsWith('/variants') && init?.method === 'POST',
      ),
    ).toBeUndefined()
  })

  it('asks before discarding an edited draft on cancel', async () => {
    mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Изменить' }))
    await user.click(
      screen.getByRole('button', { name: 'Удалить сегмент 1 (варианта ro-MD)' }),
    )
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Отменить несохранённые изменения?',
    })
    await user.click(within(dialog).getByRole('button', { name: 'Отменить изменения' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Text inițial')).toBeInTheDocument()
  })

  it('asks before switching the announcement type tab with an unsaved draft', async () => {
    mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Изменить' }))
    await user.click(
      screen.getByRole('button', { name: 'Удалить сегмент 1 (варианта ro-MD)' }),
    )
    await user.click(screen.getByRole('tab', { name: /Окончание регистрации/ }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Отменить несохранённые изменения?',
    })
    expect(screen.getByRole('tab', { name: /Начало регистрации/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Остаться' }))
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument()
  })

  it('blocks in-app navigation while a draft is unsaved', async () => {
    mockPanelApi([config()])
    const user = userEvent.setup()

    const { router } = renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Изменить' }))
    await user.click(
      screen.getByRole('button', { name: 'Удалить сегмент 1 (варианта ro-MD)' }),
    )
    void router.navigate('/elsewhere')

    const dialog = await screen.findByRole('dialog', {
      name: 'Отменить несохранённые изменения?',
    })
    expect(router.state.location.pathname).toBe('/')
    await user.click(within(dialog).getByRole('button', { name: 'Отменить изменения' }))
    expect(await screen.findByText('Другая страница')).toBeInTheDocument()
  })

  it('toggles a variant at once without opening the editor', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('switch', { name: 'Язык ro-MD включён' }))

    await waitFor(() => expect(findVariantPatch(fetchMock)).toBeDefined())
    expect(JSON.parse(String(findVariantPatch(fetchMock)?.[1]?.body))).toMatchObject({
      languageCode: 'ro-MD',
      enabled: false,
      segments: [{ type: 'text', text: 'Text inițial' }],
    })
  })

  it('moves a language up by renumbering the affected variants', async () => {
    const fetchMock = mockPanelApi([twoLanguageConfig()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Переместить язык en выше' }))

    await waitFor(() => {
      const patches = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH')
      expect(patches).toHaveLength(2)
    })
    const orders = Object.fromEntries(
      fetchMock.mock.calls
        .filter(([, init]) => init?.method === 'PATCH')
        .map(([, init]) => {
          const body = JSON.parse(String(init?.body))
          return [body.languageCode, body.sortOrder]
        }),
    )
    expect(orders).toEqual({ en: 1, 'ro-MD': 2 })
  })

  it('deletes a language only after confirmation', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Удалить язык ro-MD' }))
    const dialog = await screen.findByRole('dialog', { name: /Удалить язык/ })
    expect(
      fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE'),
    ).toBeUndefined()

    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() =>
      expect(fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')).toBeDefined(),
    )
  })

  it('applies the announcement type switch at once', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await user.click(await screen.findByRole('switch', { name: 'Включено' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, init]) =>
          init?.method === 'PATCH' && !String(url).includes('/variants/'),
      )
      expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
        enabled: false,
        repeatEveryMinutes: null,
      })
    })
  })

  it('uploads an audio file from the segment modal with the variant language', async () => {
    const fetchMock = mockPanelApi([
      config({
        variants: [
          {
            ...config().variants[0],
            segments: [
              {
                id: '01900000-0000-7000-8000-000000000013',
                sortOrder: 1,
                type: 'audio_asset',
                audioAssetId: '01900000-0000-7000-8000-000000000004',
                slot: null,
                durationMs: null,
                text: null,
              },
            ],
          },
        ],
      }),
    ])
    const user = userEvent.setup()

    const { container } = renderPanel()

    expect(await screen.findByText('opening-ro.wav · ro-MD')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Изменить' }))
    await user.click(
      screen.getByRole('button', { name: 'Редактировать сегмент 1 (варианта ro-MD)' }),
    )
    expect(await screen.findByText('Загрузить новый аудиофайл')).toBeInTheDocument()
    const input = container.ownerDocument.querySelector('input[type="file"]')
    expect(input).toBeInstanceOf(HTMLInputElement)
    await user.upload(
      input as HTMLInputElement,
      new File(['RIFF audio'], 'replacement.wav', { type: 'audio/wav' }),
    )
    await user.click(screen.getByRole('button', { name: 'Загрузить' }))

    const uploadCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes('/audio-assets') && init?.method === 'POST',
    )
    const body = uploadCall?.[1]?.body
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('languageCode')).toBe('ro-MD')
  })
})

async function selectOption(label: string, optionText: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: new RegExp(label) }))
  const options = await screen.findAllByRole('option')
  const option = options.find((element) =>
    element.textContent?.includes(optionText),
  )
  if (!option) {
    throw new Error(`Option containing "${optionText}" was not found.`)
  }
  await user.click(option)
}

function findVariantPatch(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.find(
    ([url, init]) =>
      String(url).includes('/variants/01900000-0000-7000-8000-000000000003') &&
      init?.method === 'PATCH',
  )
}
