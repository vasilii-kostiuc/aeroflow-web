import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SystemAlertsBanner } from './SystemAlertsBanner'
import { SystemStatusScreen } from './SystemStatusScreen'

function respond(data: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ success: status < 300, data, errors: [], message: 'Server error' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

function renderWith(node: ReactNode) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MantineProvider env="test">{node}</MantineProvider>
    </QueryClientProvider>,
  )
}

describe('SystemStatusScreen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the overall state and every component', async () => {
    respond({
      checkedAt: '2026-09-25T09:14:12+00:00',
      overall: 'down',
      components: [
        { key: 'agent', name: 'Аудиоагент', status: 'down', detail: 'Не подключён: объявления не прозвучат.' },
        { key: 'tts', name: 'Синтез речи (TTS)', status: 'ok', detail: 'Отвечает.' },
      ],
    })
    renderWith(<SystemStatusScreen />)

    expect(await screen.findByText('Есть неработающие компоненты')).toBeInTheDocument()
    const row = screen.getByText('Аудиоагент').closest('tr') as HTMLElement
    expect(within(row).getByText('Не работает')).toBeInTheDocument()
    expect(within(row).getByText(/объявления не прозвучат/)).toBeInTheDocument()
  })

  it('says so when the status cannot be loaded', async () => {
    respond(null, 500)
    renderWith(<SystemStatusScreen />)

    expect(await screen.findByText(/Не удалось получить состояние системы/)).toBeInTheDocument()
  })
})

describe('SystemAlertsBanner', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('stays silent while all is well', async () => {
    respond([])
    renderWith(<SystemAlertsBanner />)

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/Объявления могут не прозвучать|неизвестно/)).not.toBeInTheDocument()
  })

  it('lists what keeps announcements from sounding', async () => {
    respond([{ key: 'agent', message: 'Аудиоагент не подключён — объявления не прозвучат.' }])
    renderWith(<SystemAlertsBanner />)

    expect(await screen.findByText('Объявления могут не прозвучать')).toBeInTheDocument()
    expect(screen.getByText(/Аудиоагент не подключён/)).toBeInTheDocument()
  })

  it('warns that the state is unknown when the check fails', async () => {
    respond(null, 500)
    renderWith(<SystemAlertsBanner />)

    expect(await screen.findByText('Состояние системы неизвестно')).toBeInTheDocument()
  })
})
