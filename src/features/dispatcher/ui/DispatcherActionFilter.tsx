import { Button, Group } from '@mantine/core'

import { dispatcherFilters, filterLabels } from '../model/labels'
import type { DispatcherFilterType } from '../model/types'

type Props = {
  value: DispatcherFilterType
  onChange: (action: DispatcherFilterType) => void
}

export function DispatcherActionFilter({ value, onChange }: Props) {
  return (
    <Group gap="xs">
      {dispatcherFilters.map((action) => (
        <Button
          key={action}
          variant={action === value ? 'filled' : 'default'}
          onClick={() => onChange(action)}
        >
          {filterLabels[action]}
        </Button>
      ))}
    </Group>
  )
}
