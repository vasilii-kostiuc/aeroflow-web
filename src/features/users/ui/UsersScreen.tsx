import { useState } from 'react'

import { Alert, Button, Loader, Paper, Select, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconKey, IconUserPlus } from '@tabler/icons-react'

import { useAuthStore } from '@/features/auth/model/authStore'
import type { AppRole } from '@/features/auth/model/roles'
import { ApiClientError } from '@/shared/api/apiClient'
import { PageHeader } from '@/shared/ui/PageHeader'

import { useChangeUserRole, useUsers } from '../hooks/useUsers'
import { NO_ROLE, roleOptions } from '../model/roleOptions'
import type { User } from '../model/types'
import { UserFormModal } from './UserFormModal'

/**
 * «Пользователи» (task 033): accounts and their roles. There is no
 * self-registration — an administrator creates accounts and sets passwords.
 */
export function UsersScreen() {
  const users = useUsers()
  const changeRole = useChangeUserRole()
  const currentEmail = useAuthStore((state) => state.session?.user.email)
  const [dialog, setDialog] = useState<{ user?: User } | null>(null)

  function onRoleChange(user: User, value: string | null) {
    const role = value === NO_ROLE || value === null ? null : (value as AppRole)
    changeRole.mutate(
      { id: user.id, role },
      {
        onError: (caught) =>
          notifications.show({
            color: 'danger',
            message:
              caught instanceof ApiClientError && caught.status === 409
                ? 'Это последний администратор: сначала назначьте администратором кого-то ещё.'
                : 'Не удалось изменить роль.',
          }),
      },
    )
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Пользователи"
        description="Учётные записи и роли. Диспетчер работает с панелью, администратор настраивает систему; без роли — доступа нет."
        actions={
          <Button leftSection={<IconUserPlus size={18} />} onClick={() => setDialog({})}>
            Новый пользователь
          </Button>
        }
      />

      <Paper withBorder p="lg">
        {users.isPending && <Loader aria-label="Загрузка пользователей" />}
        {users.isError && <Alert color="danger">Не удалось загрузить пользователей.</Alert>}
        {users.data && (
          <Table.ScrollContainer minWidth={560}>
            <Table highlightOnHover aria-label="Пользователи">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>E-mail</Table.Th>
                  <Table.Th w={220}>Роль</Table.Th>
                  <Table.Th w={1} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.data.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text fw={500}>{user.email}</Text>
                      {user.email === currentEmail && (
                        <Text size="xs" c="dimmed">
                          это вы
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Select
                        aria-label={`Роль ${user.email}`}
                        allowDeselect={false}
                        data={roleOptions}
                        value={user.role ?? NO_ROLE}
                        disabled={changeRole.isPending}
                        onChange={(value) => onRoleChange(user, value)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        leftSection={<IconKey size={16} />}
                        aria-label={`Задать пароль ${user.email}`}
                        onClick={() => setDialog({ user })}
                      >
                        Пароль
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {dialog && <UserFormModal user={dialog.user} onClose={() => setDialog(null)} />}
    </Stack>
  )
}
