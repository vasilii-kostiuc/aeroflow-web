import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { PlaybackQueue, PlaybackQueueRow } from '../model/types'
import { PlaybackQueueDrawer } from './PlaybackQueueDrawer'

const { getPlaybackQueueMock, cancelAnnouncementMock, stopAnnouncementPlaybackMock } = vi.hoisted(() => ({
  getPlaybackQueueMock: vi.fn<() => Promise<PlaybackQueue>>(),
  cancelAnnouncementMock: vi.fn<(id: string) => Promise<{ id: string }>>(),
  stopAnnouncementPlaybackMock: vi.fn<(id: string) => Promise<{ announcementId: string }>>(),
}))

vi.mock('../api/dispatcherApi', () => ({
  getPlaybackQueue: getPlaybackQueueMock,
  cancelAnnouncement: cancelAnnouncementMock,
  stopAnnouncementPlayback: stopAnnouncementPlaybackMock,
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
    nextAt: null,
    ...overrides,
  }
}

function renderDrawer() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <MantineProvider env="test">
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <PlaybackQueueDrawer opened onClose={vi.fn()} />
        </QueryClientProvider>
      </ModalsProvider>
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

  it('offers cancel only on waiting rows and cancels after confirmation', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: row({ jobId: 'j-playing', state: 'playing', flightNumber: 'FC100' }),
      waiting: [
        row({
          jobId: 'j-waiting',
          announcementId: 'a-waiting',
          flightNumber: 'FC200',
        }),
      ],
      recent: [],
    })
    cancelAnnouncementMock.mockResolvedValue({ id: 'a-waiting' })

    renderDrawer()
    const user = userEvent.setup()

    // Only the waiting row exposes the cancel button.
    expect(await screen.findByText('FC200')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Убрать' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Убрать' }))
    const modalTitle = await screen.findByText('Убрать объявление из очереди?')

    // The confirmation modal repeats the action name on its confirm button.
    const modal = modalTitle.closest('section')
    expect(modal).not.toBeNull()
    await user.click(within(modal!).getByRole('button', { name: 'Убрать' }))

    await waitFor(() =>
      expect(cancelAnnouncementMock).toHaveBeenCalledWith('a-waiting'),
    )
  })

  it('offers stop only on the playing row and stops after confirmation', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: row({
        jobId: 'j-playing',
        announcementId: 'a-playing',
        state: 'playing',
        flightNumber: 'FC100',
      }),
      waiting: [
        row({
          jobId: 'j-waiting',
          announcementId: 'a-waiting',
          flightNumber: 'FC200',
        }),
      ],
      recent: [],
    })
    stopAnnouncementPlaybackMock.mockResolvedValue({ announcementId: 'a-playing' })
    // vi.fn() history survives across tests; drop earlier cancel calls so the
    // "stop does not cancel" assertion below checks this test only.
    cancelAnnouncementMock.mockClear()

    renderDrawer()
    const user = userEvent.setup()

    // Only the playing row exposes the stop button.
    expect(await screen.findByText('FC100')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Стоп' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Стоп' }))
    const modalTitle = await screen.findByText('Остановить текущее объявление?')

    const modal = modalTitle.closest('section')
    expect(modal).not.toBeNull()
    await user.click(within(modal!).getByRole('button', { name: 'Стоп' }))

    await waitFor(() =>
      expect(stopAnnouncementPlaybackMock).toHaveBeenCalledWith('a-playing'),
    )
    expect(cancelAnnouncementMock).not.toHaveBeenCalled()
  })

  it('shows an interrupted row in recent without action buttons', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: null,
      waiting: [],
      recent: [
        row({
          jobId: 'j-interrupted',
          state: 'interrupted',
          flightNumber: 'FC500',
          finishedAt: '2026-07-10T09:07:00+00:00',
        }),
      ],
    })

    renderDrawer()

    expect(await screen.findByText('FC500')).toBeInTheDocument()
    expect(screen.getByText('Прервано')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Стоп' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Убрать' })).toBeNull()
  })

  it('shows a repeat series waiting for its next tick without action buttons', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: null,
      waiting: [
        row({
          jobId: 'j-continuation',
          announcementId: 'a-continuation',
          announcementType: 'check_in_continuation',
          state: 'rescheduled',
          flightNumber: 'FC600',
          startedAt: '2026-07-10T09:10:00+00:00',
          nextAt: '2026-07-10T09:20:30+00:00',
        }),
      ],
      recent: [],
    })

    renderDrawer()

    expect(await screen.findByText('FC600')).toBeInTheDocument()
    expect(screen.getByText('Ждёт повтора')).toBeInTheDocument()
    expect(screen.getByText(/Следующий повтор в/)).toBeInTheDocument()
    // Nothing is sounding and the series ends with check-in closing, so neither
    // action applies to this row.
    expect(screen.queryByRole('button', { name: 'Стоп' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Убрать' })).toBeNull()
  })

  it('shows a cancelled row in recent', async () => {
    getPlaybackQueueMock.mockResolvedValue({
      playing: null,
      waiting: [],
      recent: [
        row({
          jobId: 'j-cancelled',
          state: 'cancelled',
          flightNumber: 'FC400',
          finishedAt: '2026-07-10T09:06:00+00:00',
        }),
      ],
    })

    renderDrawer()

    expect(await screen.findByText('FC400')).toBeInTheDocument()
    expect(screen.getByText('Отменено')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Убрать' })).toBeNull()
  })
})
