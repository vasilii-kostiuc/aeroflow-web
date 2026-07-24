import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Badge,
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

import {
  useChangeSupplementaryTemplateStatus,
  useSupplementaryTemplates,
} from '@/features/supplementary-templates/hooks/useSupplementaryTemplates'
import type { SupplementaryTemplate } from '@/features/supplementary-templates/model/types'
import { SupplementaryTemplateForm } from '@/features/supplementary-templates/ui/SupplementaryTemplateForm'

export function SupplementaryTemplatesPage() {
  const [editing, setEditing] = useState<SupplementaryTemplate | null | undefined>()
  const templates = useSupplementaryTemplates()
  const status = useChangeSupplementaryTemplateStatus()

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Дополнительные объявления</Title>
          <Text c="dimmed">
            Набор информационных объявлений аэропорта, которые диспетчер запускает из
            панели.
          </Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setEditing(null)}>
          Добавить объявление
        </Button>
      </Group>

      <Paper withBorder radius="lg" p="lg">
        <Stack>
          {templates.isPending && <Loader aria-label="Загрузка объявлений" />}
          {templates.isError && (
            <Alert color="red">Не удалось загрузить дополнительные объявления.</Alert>
          )}
          {templates.data?.length === 0 && (
            <Text c="dimmed">Дополнительные объявления ещё не настроены.</Text>
          )}
          {templates.data && templates.data.length > 0 && (
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
                  {templates.data.map((template) => (
                    <Table.Tr key={template.id}>
                      <Table.Td>
                        <Text fw={600}>{template.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        {template.languageCodes.map((code) => code.toUpperCase()).join(', ')}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={template.active ? 'green' : 'gray'}>
                          {template.active ? 'Активно' : 'Неактивно'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              aria-label={`Действия для ${template.name}`}
                            >
                              <IconDotsVertical size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={16} />}
                              onClick={() => setEditing(template)}
                            >
                              Редактировать
                            </Menu.Item>
                            <Menu.Item
                              color={template.active ? 'red' : 'green'}
                              onClick={() =>
                                status.mutate({
                                  id: template.id,
                                  active: !template.active,
                                })
                              }
                            >
                              {template.active ? 'Деактивировать' : 'Активировать'}
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

      {editing !== undefined && (
        <SupplementaryTemplateForm
          template={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </Stack>
  )
}
