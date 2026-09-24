import { Badge } from '@mantine/core'

type Props = {
  active: boolean
  /** Agreed with the noun it describes: «Активна» карточка, «Активен» аэропорт. */
  activeLabel?: string
  inactiveLabel?: string
}

/**
 * Active / inactive status of a directory record — one look on every admin
 * screen, and never truncated by a narrow column.
 */
export function StatusBadge({
  active,
  activeLabel = 'Активно',
  inactiveLabel = 'Неактивно',
}: Props) {
  return (
    <Badge
      color={active ? 'green' : 'gray'}
      variant="light"
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  )
}
