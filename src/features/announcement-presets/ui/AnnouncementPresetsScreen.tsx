import type { ReactNode } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  Loader,
  Menu,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { IconDotsVertical, IconEdit, IconPlus } from '@tabler/icons-react'

import { StatusBadge } from '@/shared/ui/StatusBadge'
import { PageHeader } from '@/shared/ui/PageHeader'

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
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={onAdd}>
            {addLabel}
          </Button>
        }
      />

      <Paper withBorder p="lg">
        <Stack>
          {isPending && <Loader aria-label={loadingLabel} />}
          {isError && <Alert color="danger">{loadErrorText}</Alert>}
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
                              color={preset.active ? 'danger' : 'success'}
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
