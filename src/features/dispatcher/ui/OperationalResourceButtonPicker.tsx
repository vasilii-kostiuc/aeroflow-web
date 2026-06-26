import { Button, Group, Stack, Text, Tooltip } from '@mantine/core'

import type { OperationalResource } from '../model/types'

type Props = {
  label: string
  resources: OperationalResource[]
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  loading?: boolean
  emptyMessage: string
  required?: boolean
}

export function OperationalResourceButtonPicker({
  label,
  resources,
  value,
  onChange,
  multiple = false,
  loading = false,
  emptyMessage,
  required = false,
}: Props) {
  const selected = new Set(value)

  function toggle(id: string) {
    if (!multiple) {
      onChange(selected.has(id) ? [] : [id])

      return
    }

    onChange(
      selected.has(id)
        ? value.filter((current) => current !== id)
        : [...value, id],
    )
  }

  return (
    <Stack gap={6}>
      <Text component="div" size="sm" fw={500}>
        {label}
        {required ? (
          <Text component="span" c="red" inherit>
            {' '}
            *
          </Text>
        ) : null}
      </Text>

      {loading ? (
        <Text c="dimmed" size="sm">
          Загрузка...
        </Text>
      ) : resources.length === 0 ? (
        <Text c="dimmed" size="sm">
          {emptyMessage}
        </Text>
      ) : (
        <Group gap="xs" wrap="wrap">
          {resources.map((resource) => {
            const isSelected = selected.has(resource.id)

            return (
              <Tooltip key={resource.id} label={resource.displayName}>
                <Button
                  aria-pressed={isSelected}
                  color={isSelected ? 'blue' : 'gray'}
                  miw={48}
                  onClick={() => toggle(resource.id)}
                  radius="sm"
                  size="sm"
                  variant={isSelected ? 'filled' : 'light'}
                >
                  {resource.code}
                </Button>
              </Tooltip>
            )
          })}
        </Group>
      )}
    </Stack>
  )
}
