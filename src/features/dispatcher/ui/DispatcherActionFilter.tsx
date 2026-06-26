import { Button, Group } from '@mantine/core'

import { actionLabels, dispatcherActions } from '../model/labels'
import type { DispatcherActionType } from '../model/types'

type Props = {
  value: DispatcherActionType
  onChange: (action: DispatcherActionType) => void
}

export function DispatcherActionFilter({ value, onChange }: Props) {
  return (
    <Group gap="xs">
      {dispatcherActions.map((action) => (
        <Button
          key={action}
          variant={action === value ? 'filled' : 'default'}
          onClick={() => onChange(action)}
        >
          {actionLabels[action]}
        </Button>
      ))}
    </Group>
  )
}
