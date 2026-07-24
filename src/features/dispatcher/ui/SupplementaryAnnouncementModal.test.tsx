import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/shared/api/apiClient'

import type { SupplementaryTemplate } from '../model/types'
import { SupplementaryAnnouncementModal } from './SupplementaryAnnouncementModal'

const mocks = vi.hoisted(() => ({
  useLanguages: vi.fn(),
  useSupplementaryTemplates: vi.fn(),
  useLaunchSupplementaryAnnouncement: vi.fn(),
}))

vi.mock('@/features/languages/hooks/useLanguages', () => ({
  useLanguages: mocks.useLanguages,
}))

vi.mock('../hooks/useLaunchSupplementaryAnnouncement', () => ({
  useSupplementaryTemplates: mocks.useSupplementaryTemplates,
  useLaunchSupplementaryAnnouncement: mocks.useLaunchSupplementaryAnnouncement,
}))

function template(overrides: Partial<SupplementaryTemplate> = {}): SupplementaryTemplate {
  return {
    id: 'template-1',
    name: 'Безопасность',
    variants: [
      { languageCode: 'ro-MD', audioAssetId: 'asset-ro' },
      { languageCode: 'ru', audioAssetId: 'asset-ru' },
    ],
    languageCodes: ['ro-MD', 'ru'],
    active: true,
    createdAt: '2026-07-24T10:00:00Z',
    updatedAt: '2026-07-24T10:00:00Z',
    ...overrides,
  }
}

type LaunchState = {
  mutate?: ReturnType<typeof vi.fn>
  isPending?: boolean
  isError?: boolean
  error?: unknown
  reset?: ReturnType<typeof vi.fn>
}

function renderModal(
  templates: SupplementaryTemplate[] = [template()],
  launch: LaunchState = {},
) {
  const mutate = launch.mutate ?? vi.fn()
  const reset = launch.reset ?? vi.fn()
  const onClose = vi.fn()

  mocks.useLanguages.mockReturnValue({
    data: [
      { code: 'ro-MD', name: 'Română', nativeName: 'Română', active: true, sortOrder: 1 },
      { code: 'ru', name: 'Русский', nativeName: 'Русский', active: true, sortOrder: 2 },
    ],
    isLoading: false,
  })
  mocks.useSupplementaryTemplates.mockReturnValue({
    data: templates,
    isLoading: false,
  })
  mocks.useLaunchSupplementaryAnnouncement.mockReturnValue({
    mutate,
    reset,
    isPending: launch.isPending ?? false,
    isError: launch.isError ?? false,
    error: launch.error,
  })

  render(
    <MantineProvider env="test">
      <SupplementaryAnnouncementModal opened onClose={onClose} />
    </MantineProvider>,
  )

  return { mutate, reset, onClose }
}

describe('SupplementaryAnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('launches the chosen preset with all its languages by default', async () => {
    const user = userEvent.setup()
    const { mutate } = renderModal()

    const submit = screen.getByRole('button', { name: 'Запустить' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByPlaceholderText('Выберите объявление'))
    await user.click(await screen.findByRole('option', { name: 'Безопасность' }))

    // Both preset languages are pre-selected.
    expect(screen.getByRole('button', { name: 'RO-MD' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(submit).toBeEnabled()

    await user.click(submit)

    expect(mutate).toHaveBeenCalledWith(
      { templateId: 'template-1', languages: ['ro-MD', 'ru'] },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('lets the dispatcher narrow the language subset', async () => {
    const user = userEvent.setup()
    const { mutate } = renderModal()

    await user.click(screen.getByPlaceholderText('Выберите объявление'))
    await user.click(await screen.findByRole('option', { name: 'Безопасность' }))

    await user.click(screen.getByRole('button', { name: 'RO-MD' }))
    await user.click(screen.getByRole('button', { name: 'Запустить' }))

    expect(mutate).toHaveBeenCalledWith(
      { templateId: 'template-1', languages: ['ru'] },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows an empty state when no presets are configured', () => {
    renderModal([])

    expect(
      screen.getByText(/Нет настроенных дополнительных объявлений/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запустить' })).toBeDisabled()
  })

  it('shows the server error message when the launch fails', () => {
    renderModal([template()], {
      isError: true,
      error: new ApiClientError({
        status: 422,
        message: 'Пресет неактивен',
      }),
    })

    expect(screen.getByText('Пресет неактивен')).toBeInTheDocument()
  })
})
