import type { ReactNode } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Menu,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconDotsVertical, IconEdit, IconPlus } from '@tabler/icons-react'

import { StatusBadge } from '@/shared/ui/StatusBadge'

import type { AnnouncementPreset } from '../model/types'

type Props = {
  title: string
  description: string
  addLabel: string
  emptyText: string
  loadErrorText: string
  loadingLabel: string
  presets?: AnnouncementPreset[]
  isPending: boolean
  isError: boolean
  onAdd: () => void
  onEdit: (preset: AnnouncementPreset) => void
  onChangeStatus: (preset: AnnouncementPreset) => void
  /** The form modal, rendered by the owning feature when something is being edited. */
  form?: ReactNode
}

/**
 * Admin catalog of announcement presets: name, languages, status, plus create,
 * edit and activate/deactivate. Shared by the supplementary (task 024) and
 * emergency (task 026) catalogs, which are the same screen over different endpoints.
 */
export function AnnouncementPresetsScreen({
  title,
  description,
  addLabel,
  emptyText,
  loadErrorText,
  loadingLabel,
  presets,
  isPending,
  isError,
  onAdd,
  onEdit,
  onChangeStatus,
  form,
}: Props) {
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Title order={1}>{title}</Title>
          <Text c="dimmed">{description}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={onAdd}
          style={{ flexShrink: 0 }}
        >
          {addLabel}
        </Button>
      </Group>

      <Paper withBorder radius="lg" p="lg">
        <Stack>
          {isPending && <Loader aria-label={loadingLabel} />}
          {isError && <Alert color="red">{loadErrorText}</Alert>}
          {presets?.length === 0 && <Text c="dimmed">{emptyText}</Text>}
          {presets && presets.length > 0 && (
            <Table.ScrollContainer minWidth={600}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Языки</Table.Th>
                    <Table.Th>Статус</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {presets.map((preset) => (
                    <Table.Tr key={preset.id}>
                      <Table.Td>
                        <Text fw={600}>{preset.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        {preset.languageCodes
                          .map((code) => code.toUpperCase())
                          .join(', ')}
                      </Table.Td>
                      <Table.Td>
                        <StatusBadge active={preset.active} />
                      </Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              aria-label={`Действия для ${preset.name}`}
                            >
                              <IconDotsVertical size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={16} />}
                              onClick={() => onEdit(preset)}
                            >
                              Редактировать
                            </Menu.Item>
                            <Menu.Item
                              color={preset.active ? 'red' : 'green'}
                              onClick={() => onChangeStatus(preset)}
                            >
                              {preset.active ? 'Деактивировать' : 'Активировать'}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Paper>

      {form}
    </Stack>
  )
}
