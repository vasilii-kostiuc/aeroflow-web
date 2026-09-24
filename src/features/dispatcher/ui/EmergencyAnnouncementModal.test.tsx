import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/shared/api/apiClient'

import type { EmergencyTemplate } from '../model/types'
import { EmergencyAnnouncementModal } from './EmergencyAnnouncementModal'

const mocks = vi.hoisted(() => ({
  useLanguages: vi.fn(),
  useEmergencyTemplates: vi.fn(),
  useLaunchEmergencyAnnouncement: vi.fn(),
}))

vi.mock('@/features/languages/hooks/useLanguages', () => ({
  useLanguages: mocks.useLanguages,
}))

vi.mock('../hooks/useEmergencyAnnouncement', () => ({
  useEmergencyTemplates: mocks.useEmergencyTemplates,
  useLaunchEmergencyAnnouncement: mocks.useLaunchEmergencyAnnouncement,
}))

function template(overrides: Partial<EmergencyTemplate> = {}): EmergencyTemplate {
  return {
    id: 'preset-1',
    name: 'Пожарная тревога',
    variants: [
      { languageCode: 'ro-MD', audioAssetId: 'asset-ro' },
      { languageCode: 'ru', audioAssetId: 'asset-ru' },
    ],
    languageCodes: ['ro-MD', 'ru'],
    active: true,
    createdAt: '2026-09-23T10:00:00Z',
    updatedAt: '2026-09-23T10:00:00Z',
    ...overrides,
  }
}

function renderModal(
  templates: EmergencyTemplate[] = [template()],
  launch: { isError?: boolean; error?: unknown } = {},
) {
  const mutate = vi.fn()
  const reset = vi.fn()

  mocks.useLanguages.mockReturnValue({
    data: [
      { code: 'ro-MD', name: 'Română', nativeName: 'Română', active: true, sortOrder: 1 },
      { code: 'ru', name: 'Русский', nativeName: 'Русский', active: true, sortOrder: 2 },
    ],
    isLoading: false,
  })
  mocks.useEmergencyTemplates.mockReturnValue({ data: templates, isLoading: false })
  mocks.useLaunchEmergencyAnnouncement.mockReturnValue({
    mutate,
    reset,
    isPending: false,
    isError: launch.isError ?? false,
    error: launch.error,
  })

  render(
    <MantineProvider env="test">
      <EmergencyAnnouncementModal opened onClose={vi.fn()} />
    </MantineProvider>,
  )

  return { mutate }
}

describe('EmergencyAnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('warns what an emergency launch does before anything is chosen', () => {
    renderModal()

    expect(
      screen.getByText(/прервёт звучащее и остановит обычную очередь/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Запустить экстренное' }),
    ).toBeDisabled()
  })

  it('launches the chosen preset with all its languages by default', async () => {
    const user = userEvent.setup()
    const { mutate } = renderModal()

    await user.click(screen.getByPlaceholderText('Выберите объявление'))
    await user.click(await screen.findByRole('option', { name: 'Пожарная тревога' }))

    const submit = screen.getByRole('button', { name: 'Запустить экстренное' })
    expect(submit).toBeEnabled()
    await user.click(submit)

    expect(mutate).toHaveBeenCalledWith(
      { templateId: 'preset-1', languages: ['ro-MD', 'ru'] },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows an empty state when no presets are configured', () => {
    renderModal([])

    expect(
      screen.getByText(/Нет настроенных экстренных объявлений/),
    ).toBeInTheDocument()
  })

  it('shows the server error message when the launch fails', () => {
    renderModal([template()], {
      isError: true,
      error: new ApiClientError({ status: 422, message: 'Пресет неактивен' }),
    })

    expect(screen.getByText('Пресет неактивен')).toBeInTheDocument()
  })
})
