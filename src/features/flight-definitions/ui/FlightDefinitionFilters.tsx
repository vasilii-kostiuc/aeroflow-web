import { Group, Select, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

import type {
  FlightDefinitionFilters as Filters,
  FlightDirection,
} from '../model/types'

type Props = {
  filters: Filters
  onChange: (changes: Partial<Filters>) => void
}

export function FlightDefinitionFilters({ filters, onChange }: Props) {
  return (
    <Group align="flex-end" grow>
      <TextInput
        label="Поиск"
        placeholder="Номер рейса"
        leftSection={<IconSearch size={16} />}
        value={filters.search ?? ''}
        onChange={(event) =>
          onChange({ search: event.currentTarget.value || undefined, page: 1 })
        }
      />
      <Select
        label="Направление"
        placeholder="Все"
        clearable
        data={[
          { value: 'departure', label: 'Вылет' },
          { value: 'arrival', label: 'Прибытие' },
        ]}
        value={filters.direction ?? null}
        onChange={(value) =>
          onChange({
            direction: (value as FlightDirection | null) ?? undefined,
            page: 1,
          })
        }
      />
      <Select
        label="Статус"
        placeholder="Все"
        clearable
        data={[
          { value: 'true', label: 'Активные' },
          { value: 'false', label: 'Неактивные' },
        ]}
        value={
          filters.active === undefined ? null : String(filters.active)
        }
        onChange={(value) =>
          onChange({
            active: value === null ? undefined : value === 'true',
            page: 1,
          })
        }
      />
    </Group>
  )
}

