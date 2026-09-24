import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLibraryPreferences } from '@/features/audio-assets/model/libraryPreferences'

import { SupplementaryTemplateForm } from './SupplementaryTemplateForm'

const mocks = vi.hoisted(() => ({
  useLanguages: vi.fn(),
  useAudioAssets: vi.fn(),
  useAudioFolders: vi.fn(),
  useCreateSupplementaryTemplate: vi.fn(),
  useUpdateSupplementaryTemplate: vi.fn(),
  useGenerateAudioAsset: vi.fn(),
}))

vi.mock('@/features/languages/hooks/useLanguages', () => ({
  useLanguages: mocks.useLanguages,
}))

vi.mock('@/features/audio-assets/hooks/useAudioAssets', () => ({
  useAudioAssets: mocks.useAudioAssets,
  useGenerateAudioAsset: mocks.useGenerateAudioAsset,
  useUploadAudioAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/features/audio-assets/hooks/useAudioFolders', () => ({
  useAudioFolders: mocks.useAudioFolders,
}))

vi.mock('../hooks/useSupplementaryTemplates', () => ({
  useCreateSupplementaryTemplate: mocks.useCreateSupplementaryTemplate,
  useUpdateSupplementaryTemplate: mocks.useUpdateSupplementaryTemplate,
}))

const asset = (id: string, title: string, languageCode: string) => ({
  id,
  title,
  name: `${id}.wav`,
  languageCode,
  folderId: null,
  source: 'uploaded' as const,
  active: true,
})

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
    data: [asset('asset-ru', 'Безопасность RU', 'ru'), asset('asset-ro', 'Securitate RO', 'ro-MD')],
    isLoading: false,
  })
  mocks.useAudioFolders.mockReturnValue({ data: [], isLoading: false })
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
    useLibraryPreferences.setState({ byUser: {} })
  })

  it('creates a preset with a name and a language variant', async () => {
    const user = userEvent.setup()
    const { createMutateAsync, onClose } = setup()

    await user.type(screen.getByLabelText(/Название/), 'Безопасность')

    await user.click(screen.getAllByLabelText('Язык варианта 1')[0])
    await user.click(await screen.findByRole('option', { name: 'Русский (ru)' }))

    await user.click(screen.getByRole('button', { name: 'Выбрать: Аудио варианта 1' }))
    await user.click(await screen.findByRole('button', { name: 'Выбрать Безопасность RU' }))

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
    const generateMutateAsync = vi.fn().mockResolvedValue(
      asset('asset-generated', 'Заказ такси у стойки информации', 'ru'),
    )
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
      await user.click(screen.getByRole('button', { name: `Выбрать: Аудио варианта ${index}` }))
      // From the second pick on, the asset is also listed under «Недавно использованные».
      await user.click((await screen.findAllByRole('button', { name: 'Выбрать Безопасность RU' }))[0])
    }

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(createMutateAsync).not.toHaveBeenCalled()
    expect(
      screen.getByText('Языки вариантов не должны повторяться.'),
    ).toBeInTheDocument()
  })

  it('shows only the variant language by default and remembers the pick as recent', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getAllByLabelText('Язык варианта 1')[0])
    await user.click(await screen.findByRole('option', { name: 'Русский (ru)' }))

    await user.click(screen.getByRole('button', { name: 'Выбрать: Аудио варианта 1' }))
    const dialog = await screen.findByRole('dialog', { name: 'Выбор аудиофайла' })
    expect(within(dialog).getByText('Безопасность RU')).toBeInTheDocument()
    expect(within(dialog).queryByText('Securitate RO')).not.toBeInTheDocument()

    await user.click(within(dialog).getByText('Безопасность RU'))
    // The field now shows the picked asset by title.
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Выбор аудиофайла' })).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Безопасность RU')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Выбрать: Аудио варианта 1' }))
    const reopened = await screen.findByRole('dialog', { name: 'Выбор аудиофайла' })
    expect(within(reopened).getByRole('table', { name: 'Недавно использованные' })).toBeInTheDocument()
  })
})
