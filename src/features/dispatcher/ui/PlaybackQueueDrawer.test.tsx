import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { PlaybackQueue, PlaybackQueueRow } from '../model/types'
import { PlaybackQueueDrawer } from './PlaybackQueueDrawer'

const { getPlaybackQueueMock } = vi.hoisted(() => ({
  getPlaybackQueueMock: vi.fn<() => Promise<PlaybackQueue>>(),
}))

vi.mock('../api/dispatcherApi', () => ({
  getPlaybackQueue: getPlaybackQueueMock,
}))

function row(overrides: Partial<PlaybackQueueRow>): PlaybackQueueRow {
  return {
    announcementId: 'a-1',
    jobId: 'j-1',
    flightNumber: 'FC123',
    announcementType: 'check_in_opening',
    languages: ['ro-MD', 'ru'],
    checkInCounters: [{ id: 'c-1', code: '3' }],
    gate: null,
    state: 'waiting',
    queuedAt: '2026-07-10T09:00:00+00:00',
    startedAt: null,
    finishedAt: null,
    failureReason: null,
    ...overrides,
  }
}

function renderDrawer() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <MantineProvider env="test">
      <QueryClientProvider client={queryClient}>
        <PlaybackQueueDrawer opened onClose={vi.fn()} />
      </QueryClientProvider>
    </MantineProvider>,
  )
}

describe('PlaybackQueueDrawer', () => {
  it('shows playing, waiting and recent sections', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: row({ jobId: 'j-playing', state: 'playing', flightNumber: 'FC100' }),
      waiting: [row({ jobId: 'j-waiting', flightNumber: 'FC200' })],
      recent: [
        row({
          jobId: 'j-failed',
          state: 'failed',
          flightNumber: 'FC300',
          failureReason: 'player exited 1',
          finishedAt: '2026-07-10T09:05:00+00:00',
        }),
      ],
    })

    renderDrawer()

    expect(await screen.findByText('FC100')).toBeInTheDocument()
    expect(screen.getByText('FC200')).toBeInTheDocument()
    expect(screen.getByText('FC300')).toBeInTheDocument()
    expect(screen.getByText('Звучит')).toBeInTheDocument()
    expect(screen.getByText('Ошибка')).toBeInTheDocument()
    expect(screen.getByText('player exited 1')).toBeInTheDocument()
    expect(screen.getAllByText(/стойки 3/).length).toBeGreaterThan(0)
  })

  it('shows empty states when nothing is queued', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: null,
      waiting: [],
      recent: [],
    })

    renderDrawer()

    expect(
      await screen.findByText('Тишина — очередь свободна'),
    ).toBeInTheDocument()
    expect(screen.getByText('Нет ожидающих объявлений')).toBeInTheDocument()
    expect(screen.getByText('Сегодня ещё ничего не звучало')).toBeInTheDocument()
  })

  it('warns when the queue cannot be refreshed', async () => {
    getPlaybackQueueMock.mockRejectedValue(new Error('network'))

    renderDrawer()

    expect(
      await screen.findByText(
        'Не удалось обновить очередь — данные могут быть неактуальны.',
      ),
    ).toBeInTheDocument()
  })
})
