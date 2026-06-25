import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  return render(
    <MantineProvider env="test">
      <QueryClientProvider client={queryClient}>
        <FlightAnnouncementConfigsPanel flightDefinition={flight} />
      </QueryClientProvider>
    </MantineProvider>,
  )
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
    expect(screen.getByRole('tab', { name: /Продолжение регистрации/ })).toBeInTheDocument()
    expect(screen.getByText('готово для диспетчера')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Продолжение регистрации/ }))
    expect(
      await screen.findByText('Настройка для этого типа объявления ещё не создана.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Создать настройку' }))

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/announcement-configs') && init?.method === 'POST',
    )
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      announcementType: 'check_in_continuation',
      enabled: true,
      repeatEveryMinutes: 6,
    })
  })

  it('edits a segment through the modal and submits the updated variant', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await screen.findByText('Text inițial')
    await user.click(
      screen.getByRole('button', {
        name: 'Редактировать сегмент 1 (варианта ro-MD)',
      }),
    )
    const text = await screen.findByLabelText('Текст')
    await user.clear(text)
    await user.type(text, 'Text actualizat')
    await user.click(screen.getByRole('button', { name: 'Сохранить сегмент' }))
    await user.click(screen.getAllByRole('button', { name: 'Сохранить вариант' })[0])

    const patchCall = findVariantPatch(fetchMock)
    expect(patchCall).toBeDefined()
    const payload = JSON.parse(String(patchCall?.[1]?.body))
    expect(payload).toMatchObject({
      languageCode: 'ro-MD',
      segments: [{ sortOrder: 1, type: 'text', text: 'Text actualizat' }],
    })
  })

  it('adds a segment through the modal and submits it with the variant draft', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await screen.findByText('Text inițial')
    await user.click(screen.getAllByRole('button', { name: 'Добавить сегмент' })[0])
    await selectOption('Тип', 'Пауза')
    await user.clear(screen.getByLabelText('Длительность, мс'))
    await user.type(screen.getByLabelText('Длительность, мс'), '700')
    await user.click(screen.getByRole('button', { name: 'Сохранить сегмент' }))
    await user.click(screen.getAllByRole('button', { name: 'Сохранить вариант' })[0])

    const patchCall = findVariantPatch(fetchMock)
    const payload = JSON.parse(String(patchCall?.[1]?.body))
    expect(payload.segments).toMatchObject([
      { sortOrder: 1, type: 'text', text: 'Text inițial' },
      { sortOrder: 2, type: 'pause', durationMs: 700 },
    ])
  })

  it('reveals the new language variant form from a button and hides it after save', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await screen.findByText('Text inițial')
    expect(screen.queryByText('Новый языковой вариант')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Добавить вариант' }))

    expect(await screen.findByText('Новый языковой вариант')).toBeInTheDocument()
    expect(screen.getByText('Добавьте хотя бы один сегмент.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Сохранить вариант' })[1]).toBeDisabled()

    await user.click(screen.getAllByRole('button', { name: 'Добавить сегмент' })[1])
    await selectOption('Тип', 'Пауза')
    await user.clear(screen.getByLabelText('Длительность, мс'))
    await user.type(screen.getByLabelText('Длительность, мс'), '700')
    await user.click(screen.getByRole('button', { name: 'Сохранить сегмент' }))

    const saveNewVariant = screen.getAllByRole('button', {
      name: 'Сохранить вариант',
    })[1]
    expect(saveNewVariant).toBeEnabled()
    await user.click(saveNewVariant)

    const createVariantCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/variants') && init?.method === 'POST',
    )
    expect(createVariantCall).toBeDefined()
    const payload = JSON.parse(String(createVariantCall?.[1]?.body))
    expect(payload).toMatchObject({
      languageCode: 'ro-MD',
      segments: [{ sortOrder: 1, type: 'pause', durationMs: 700 }],
    })
    await waitFor(() => {
      expect(screen.queryByText('Новый языковой вариант')).not.toBeInTheDocument()
    })
  })

  it('cancels the new language variant form without sending a create request', async () => {
    const fetchMock = mockPanelApi([config()])
    const user = userEvent.setup()

    renderPanel()

    await screen.findByText('Text inițial')
    await user.click(screen.getByRole('button', { name: 'Добавить вариант' }))
    expect(await screen.findByText('Новый языковой вариант')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(screen.queryByText('Новый языковой вариант')).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.find(
        ([url, init]) => String(url).endsWith('/variants') && init?.method === 'POST',
      ),
    ).toBeUndefined()
  })

  it('moves segments up and down before saving the variant payload', async () => {
    const fetchMock = mockPanelApi([
      config({
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
                text: 'Primul',
              },
              {
                id: '01900000-0000-7000-8000-000000000014',
                sortOrder: 2,
                type: 'pause',
                audioAssetId: null,
                slot: null,
                durationMs: 900,
                text: null,
              },
            ],
            enabled: true,
            createdAt: '2026-06-22T10:00:00+00:00',
            updatedAt: '2026-06-22T10:00:00+00:00',
          },
        ],
      }),
    ])
    const user = userEvent.setup()

    renderPanel()

    await screen.findByText('Primul')
    await user.click(
      screen.getByRole('button', {
        name: 'Переместить сегмент 2 выше (варианта ro-MD)',
      }),
    )
    await user.click(screen.getAllByRole('button', { name: 'Сохранить вариант' })[0])

    const patchCall = findVariantPatch(fetchMock)
    const payload = JSON.parse(String(patchCall?.[1]?.body))
    expect(payload.segments).toMatchObject([
      { sortOrder: 1, type: 'pause', durationMs: 900 },
      { sortOrder: 2, type: 'text', text: 'Primul' },
    ])
  })

  it('uploads an audio file from the segment modal with the selected language', async () => {
    const fetchMock = mockPanelApi([
      config({
        variants: [
          {
            id: '01900000-0000-7000-8000-000000000003',
            languageCode: 'ro-MD',
            sortOrder: 1,
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
            enabled: true,
            createdAt: '2026-06-22T10:00:00+00:00',
            updatedAt: '2026-06-22T10:00:00+00:00',
          },
        ],
      }),
    ])
    const user = userEvent.setup()

    const { container } = renderPanel()

    await screen.findByText('opening-ro.wav · ro-MD')
    await user.click(
      screen.getByRole('button', {
        name: 'Редактировать сегмент 1 (варианта ro-MD)',
      }),
    )
    expect(await screen.findByText('Загрузить новый аудиофайл')).toBeInTheDocument()
    const input = container.querySelector('input[type="file"]')
    expect(input).toBeInstanceOf(HTMLInputElement)
    await user.upload(
      input as HTMLInputElement,
      new File(['RIFF audio'], 'replacement.wav', { type: 'audio/wav' }),
    )
    await user.click(screen.getByRole('button', { name: 'Загрузить' }))

    const uploadCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/audio-assets') && init?.method === 'POST',
    )
    expect(uploadCall).toBeDefined()
    const body = uploadCall?.[1]?.body
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('languageCode')).toBe('ro-MD')
    expect((body as FormData).get('file')).toBeInstanceOf(File)
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
