import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmergencyModeBanner } from './EmergencyModeBanner'

const mocks = vi.hoisted(() => ({
  useEmergencyMode: vi.fn(),
  useDeactivateEmergencyMode: vi.fn(),
}))

vi.mock('../hooks/useEmergencyAnnouncement', () => ({
  useEmergencyMode: mocks.useEmergencyMode,
  useDeactivateEmergencyMode: mocks.useDeactivateEmergencyMode,
}))

function renderBanner(mode: { active: boolean; since: string | null } | undefined) {
  const mutate = vi.fn()

  mocks.useEmergencyMode.mockReturnValue({ data: mode })
  mocks.useDeactivateEmergencyMode.mockReturnValue({ mutate, isPending: false })

  render(
    <MantineProvider env="test">
      <ModalsProvider>
        <EmergencyModeBanner />
      </ModalsProvider>
    </MantineProvider>,
  )

  return { mutate }
}

describe('EmergencyModeBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stays hidden while the mode is not active', () => {
    renderBanner({ active: false, since: null })

    expect(screen.queryByText('Экстренный режим активен')).not.toBeInTheDocument()
  })

  it('stays hidden until the mode state is known', () => {
    renderBanner(undefined)

    expect(screen.queryByText('Экстренный режим активен')).not.toBeInTheDocument()
  })

  it('announces the active mode and lifts it after confirmation', async () => {
    const user = userEvent.setup()
    const { mutate } = renderBanner({
      active: true,
      since: '2026-09-23T10:00:00+00:00',
    })

    expect(screen.getByText('Экстренный режим активен')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Деактивировать экстренный режим' }),
    )
    // The confirmation is the same guard the Stop and Cancel actions use.
    await user.click(await screen.findByRole('button', { name: 'Деактивировать' }))

    expect(mutate).toHaveBeenCalled()
  })
})
