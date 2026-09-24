import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AudioPreviewButton } from './AudioPreviewButton'

const mocks = vi.hoisted(() => ({
  fetchAudioAssetObjectUrl: vi.fn(),
}))

vi.mock('@/shared/api/audioAssetFile', () => ({
  fetchAudioAssetObjectUrl: mocks.fetchAudioAssetObjectUrl,
}))

function renderButton(audioAssetId: string | null) {
  render(
    <MantineProvider env="test">
      <AudioPreviewButton audioAssetId={audioAssetId} />
    </MantineProvider>,
  )
}

describe('AudioPreviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom does not implement media playback or object URLs.
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()
    URL.revokeObjectURL = vi.fn()
  })

  it('fetches the asset file and starts playback on click', async () => {
    const user = userEvent.setup()
    mocks.fetchAudioAssetObjectUrl.mockResolvedValue('blob:mock-url')
    renderButton('asset-1')

    await user.click(screen.getByRole('button', { name: 'Прослушать' }))

    expect(mocks.fetchAudioAssetObjectUrl).toHaveBeenCalledWith('asset-1')
    expect(await screen.findByRole('button', { name: 'Остановить' })).toBeInTheDocument()
  })

  it('is disabled without an asset', () => {
    renderButton(null)

    expect(screen.getByRole('button', { name: 'Прослушать' })).toBeDisabled()
    expect(mocks.fetchAudioAssetObjectUrl).not.toHaveBeenCalled()
  })

  it('stops the previous preview when another one starts', async () => {
    const user = userEvent.setup()
    mocks.fetchAudioAssetObjectUrl.mockResolvedValue('blob:mock-url')
    render(
      <MantineProvider env="test">
        <AudioPreviewButton audioAssetId="asset-1" label="Прослушать первый" />
        <AudioPreviewButton audioAssetId="asset-2" label="Прослушать второй" />
      </MantineProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Прослушать первый' }))
    expect(await screen.findByRole('button', { name: 'Остановить' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Прослушать второй' }))

    // Still exactly one stop button: the first preview went back to «play».
    expect(await screen.findAllByRole('button', { name: 'Остановить' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Прослушать первый' })).toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })
})
