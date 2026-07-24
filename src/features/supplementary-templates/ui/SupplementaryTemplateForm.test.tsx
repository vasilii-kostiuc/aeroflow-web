import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SupplementaryTemplateForm } from './SupplementaryTemplateForm'

const mocks = vi.hoisted(() => ({
  useLanguages: vi.fn(),
  useAudioAssets: vi.fn(),
  useCreateSupplementaryTemplate: vi.fn(),
  useUpdateSupplementaryTemplate: vi.fn(),
  useGenerateAudioAsset: vi.fn(),
}))

vi.mock('@/features/languages/hooks/useLanguages', () => ({
  useLanguages: mocks.useLanguages,
}))

vi.mock('../hooks/useSupplementaryTemplates', () => ({
  useAudioAssets: mocks.useAudioAssets,
  useCreateSupplementaryTemplate: mocks.useCreateSupplementaryTemplate,
  useUpdateSupplementaryTemplate: mocks.useUpdateSupplementaryTemplate,
  useGenerateAudioAsset: mocks.useGenerateAudioAsset,
}))

function setup(
  createMutateAsync = vi.fn().mockResolvedValue({}),
  generateMutateAsync = vi.fn(),
) {
  const onClose = vi.fn()

  mocks.useLanguages.mockReturnValue({
    data: [
      { code: 'ro-MD', name: 'Română', nativeName: 'Română', active: true, sortOrder: 1 },
      { code: 'ru', name: 'Русский', nativeName: 'Русский', active: true, sortOrder: 2 },
    ],
    isLoading: false,
  })
  mocks.useAudioAssets.mockReturnValue({
    data: [
      { id: 'asset-ru', name: 'Безопасность RU', languageCode: 'ru', active: true },
      { id: 'asset-ro', name: 'Securitate RO', languageCode: 'ro-MD', active: true },
    ],
    isLoading: false,
  })
  mocks.useCreateSupplementaryTemplate.mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  })
  mocks.useUpdateSupplementaryTemplate.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  })
  mocks.useGenerateAudioAsset.mockReturnValue({
    mutateAsync: generateMutateAsync,
    isPending: false,
  })

  render(
    <MantineProvider env="test">
      <SupplementaryTemplateForm template={null} onClose={onClose} />
    </MantineProvider>,
  )

  return { onClose, createMutateAsync }
}

describe('SupplementaryTemplateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a preset with a name and a language variant', async () => {
    const user = userEvent.setup()
    const { createMutateAsync, onClose } = setup()

    await user.type(screen.getByLabelText(/Название/), 'Безопасность')

    await user.click(screen.getAllByLabelText('Язык варианта 1')[0])
    await user.click(await screen.findByRole('option', { name: 'Русский (ru)' }))

    await user.click(screen.getAllByLabelText('Аудио варианта 1')[0])
    await user.click(await screen.findByRole('option', { name: 'Безопасность RU (ru)' }))

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(createMutateAsync).toHaveBeenCalledWith({
      name: 'Безопасность',
      variants: [{ languageCode: 'ru', audioAssetId: 'asset-ru' }],
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('voices text into an asset and uses it for the variant', async () => {
    const user = userEvent.setup()
    const createMutateAsync = vi.fn().mockResolvedValue({})
    const generateMutateAsync = vi.fn().mockResolvedValue({
      id: 'asset-generated',
      name: 'Озвучено',
      languageCode: 'ru',
      active: true,
    })
    setup(createMutateAsync, generateMutateAsync)

    await user.type(screen.getByLabelText(/Название/), 'Такси')

    await user.click(screen.getAllByLabelText('Язык варианта 1')[0])
    await user.click(await screen.findByRole('option', { name: 'Русский (ru)' }))

    await user.type(
      screen.getByLabelText('Текст для озвучивания варианта 1'),
      'Заказ такси у стойки информации',
    )
    await user.click(screen.getByRole('button', { name: 'Озвучить' }))

    expect(generateMutateAsync).toHaveBeenCalledWith({
      text: 'Заказ такси у стойки информации',
      languageCode: 'ru',
    })

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(createMutateAsync).toHaveBeenCalledWith({
      name: 'Такси',
      variants: [{ languageCode: 'ru', audioAssetId: 'asset-generated' }],
    })
  })

  it('rejects duplicate languages without calling the API', async () => {
    const user = userEvent.setup()
    const createMutateAsync = vi.fn().mockResolvedValue({})
    setup(createMutateAsync)

    await user.type(screen.getByLabelText(/Название/), 'Безопасность')

    // Two variants, both Russian.
    await user.click(screen.getByRole('button', { name: 'Добавить язык' }))

    for (const index of [1, 2]) {
      await user.click(screen.getAllByLabelText(`Язык варианта ${index}`)[0])
      await user.click(await screen.findByRole('option', { name: 'Русский (ru)' }))
      await user.click(screen.getAllByLabelText(`Аудио варианта ${index}`)[0])
      await user.click(await screen.findByRole('option', { name: 'Безопасность RU (ru)' }))
    }

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(createMutateAsync).not.toHaveBeenCalled()
    expect(
      screen.getByText('Языки вариантов не должны повторяться.'),
    ).toBeInTheDocument()
  })
})
