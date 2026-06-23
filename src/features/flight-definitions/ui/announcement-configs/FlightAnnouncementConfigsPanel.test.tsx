import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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

function response(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data, errors: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
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

describe('FlightAnnouncementConfigsPanel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows dispatcher validity and updates an existing variant', async () => {
    const config = {
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
          sourceType: 'text',
          audioAssetId: null,
          text: 'Text inițial',
          enabled: true,
          createdAt: '2026-06-22T10:00:00+00:00',
          updatedAt: '2026-06-22T10:00:00+00:00',
        },
      ],
      createdAt: '2026-06-22T10:00:00+00:00',
      updatedAt: '2026-06-22T10:00:00+00:00',
    }
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/audio-assets')) return response([])
      if (init?.method === 'PATCH') return response(config)

      return response([config])
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderPanel()

    expect(await screen.findByText('готово для диспетчера')).toBeInTheDocument()
    const text = await screen.findByDisplayValue('Text inițial')
    await user.clear(text)
    await user.type(text, 'Text actualizat')
    await user.click(screen.getByRole('button', { name: 'Сохранить вариант' }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/variants/01900000-0000-7000-8000-000000000003'),
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('Text actualizat'),
      }),
    )
  })

  it('uploads an audio file from an audio variant editor', async () => {
    const config = {
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
          sourceType: 'audio_asset',
          audioAssetId: '01900000-0000-7000-8000-000000000004',
          text: null,
          enabled: true,
          createdAt: '2026-06-22T10:00:00+00:00',
          updatedAt: '2026-06-22T10:00:00+00:00',
        },
      ],
      createdAt: '2026-06-22T10:00:00+00:00',
      updatedAt: '2026-06-22T10:00:00+00:00',
    }
    const uploadedAsset = {
      id: '01900000-0000-7000-8000-000000000005',
      name: 'replacement.wav',
      languageCode: 'ro-MD',
      active: true,
      mimeType: 'audio/x-wav',
      sizeBytes: 44,
    }
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/audio-assets') && init?.method === 'POST') {
        return response(uploadedAsset)
      }
      if (url.includes('/audio-assets')) return response([])

      return response([config])
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    const { container } = renderPanel()

    await screen.findByText('Загрузить новый аудиофайл')
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
