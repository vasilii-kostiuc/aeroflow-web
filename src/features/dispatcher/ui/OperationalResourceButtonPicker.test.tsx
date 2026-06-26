import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { OperationalResource } from '../model/types'
import { OperationalResourceButtonPicker } from './OperationalResourceButtonPicker'

const resources: OperationalResource[] = [
  {
    id: 'counter-1',
    code: '1',
    displayName: 'Стойка регистрации 1',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'counter-2',
    code: '2',
    displayName: 'Стойка регистрации 2',
    sortOrder: 2,
    active: true,
  },
]

function renderPicker(
  props: Partial<ComponentProps<typeof OperationalResourceButtonPicker>>,
) {
  const onChange = props.onChange ?? vi.fn()

  render(
    <MantineProvider env="test">
      <OperationalResourceButtonPicker
        emptyMessage="Нет ресурсов"
        label="Ресурсы"
        onChange={onChange}
        resources={resources}
        value={[]}
        {...props}
      />
    </MantineProvider>,
  )

  return { onChange }
}

describe('OperationalResourceButtonPicker', () => {
  it('adds and removes values in multiple mode', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderPicker({ multiple: true, onChange, value: ['counter-1'] })

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(onChange).toHaveBeenLastCalledWith(['counter-1', 'counter-2'])

    await user.click(screen.getByRole('button', { name: '1' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('selects one value in single mode and clears it on repeated click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderPicker({ onChange, value: ['counter-1'] })

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(onChange).toHaveBeenLastCalledWith(['counter-2'])

    await user.click(screen.getByRole('button', { name: '1' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('shows loading and empty states', () => {
    const { rerender } = render(
      <MantineProvider env="test">
        <OperationalResourceButtonPicker
          emptyMessage="Нет активных стоек"
          label="Стойки"
          loading
          onChange={vi.fn()}
          resources={[]}
          value={[]}
        />
      </MantineProvider>,
    )

    expect(screen.getByText('Загрузка...')).toBeInTheDocument()

    rerender(
      <MantineProvider env="test">
        <OperationalResourceButtonPicker
          emptyMessage="Нет активных стоек"
          label="Стойки"
          onChange={vi.fn()}
          resources={[]}
          value={[]}
        />
      </MantineProvider>,
    )

    expect(screen.getByText('Нет активных стоек')).toBeInTheDocument()
  })
})
