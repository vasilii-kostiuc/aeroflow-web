import type { ReactNode } from 'react'

import { Group, Stack, Text, Title } from '@mantine/core'

type Props = {
  title: ReactNode
  /** One sentence on what the screen is for; wraps under the title. */
  description?: ReactNode
  /** Shown next to the title, e.g. a status badge. */
  badge?: ReactNode
  /** Primary actions, always top-right — a long description never pushes them down. */
  actions?: ReactNode
}

/** The title block every screen starts with (task 030). */
export function PageHeader({ title, description, badge, actions }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="lg">
      <Stack gap={4} style={{ minWidth: 0 }}>
        <Group gap="sm" wrap="nowrap">
          <Title order={1}>{title}</Title>
          {badge}
        </Group>
        {description ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? (
        <Group gap="sm" wrap="wrap" justify="flex-end" style={{ flexShrink: 0 }}>
          {actions}
        </Group>
      ) : null}
    </Group>
  )
}
