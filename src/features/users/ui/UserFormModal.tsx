import { useState } from 'react'

import { Alert, Button, Group, Modal, PasswordInput, Select, Stack, TextInput } from '@mantine/core'

import type { AppRole } from '@/features/auth/model/roles'
import { ApiClientError } from '@/shared/api/apiClient'

import { useCreateUser, useSetUserPassword } from '../hooks/useUsers'
import { NO_ROLE, roleOptions } from '../model/roleOptions'
import type { User } from '../model/types'

const MIN_PASSWORD = 8

/** «Новый пользователь», or «Задать пароль» for an existing one. */
export function UserFormModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const create = useCreateUser()
  const setPassword = useSetUserPassword()
  const [email, setEmail] = useState('')
  const [password, setPasswordValue] = useState('')
  const [role, setRole] = useState<string>('dispatcher')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || setPassword.isPending

  async function save() {
    setError(null)
    try {
      if (user) {
        await setPassword.mutateAsync({ id: user.id, password })
      } else {
        await create.mutateAsync({
          email: email.trim(),
          password,
          role: role === NO_ROLE ? null : (role as AppRole),
        })
      }
      onClose()
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? 'Пользователь с таким e-mail уже есть.'
          : caught instanceof ApiClientError
            ? caught.message
            : 'Не удалось сохранить.',
      )
    }
  }

  return (
    <Modal opened onClose={onClose} title={user ? `Пароль: ${user.email}` : 'Новый пользователь'} centered>
      <Stack>
        {!user && (
          <TextInput
            label="E-mail"
            required
            data-autofocus
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
        )}
        <PasswordInput
          label={user ? 'Новый пароль' : 'Пароль'}
          description={
            user
              ? 'Не короче 8 символов. Пользователь будет выведен из других сессий.'
              : 'Не короче 8 символов.'
          }
          required
          value={password}
          onChange={(event) => setPasswordValue(event.currentTarget.value)}
        />
        {!user && (
          <Select
            label="Роль"
            allowDeselect={false}
            data={roleOptions}
            value={role}
            onChange={(value) => setRole(value ?? 'dispatcher')}
          />
        )}
        {error && <Alert color="danger">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button
            loading={pending}
            disabled={password.length < MIN_PASSWORD || (!user && !email.trim())}
            onClick={() => void save()}
          >
            {user ? 'Задать пароль' : 'Создать'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
