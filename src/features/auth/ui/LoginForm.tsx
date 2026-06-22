import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import { useLocation, useNavigate } from 'react-router'

import { paths } from '@/app/router/paths'
import { useLogin } from '@/features/auth/hooks/useLogin'
import type { LoginInput } from '@/features/auth/model/types'
import { ApiClientError } from '@/shared/api/apiClient'

type LoginLocationState = {
  from?: string
}

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  const form = useForm<LoginInput>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value.trim()) {
          return 'Введите email'
        }

        return /^\S+@\S+\.\S+$/.test(value) ? null : 'Введите корректный email'
      },
      password: (value) => (value ? null : 'Введите пароль'),
    },
  })

  const mutationError =
    loginMutation.error instanceof ApiClientError ? loginMutation.error : null
  const generalError =
    mutationError?.status === 401
      ? 'Неверный email или пароль'
      : mutationError?.message

  const handleSubmit = form.onSubmit(async (values) => {
    form.clearErrors()

    try {
      await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      })

      const state = location.state as LoginLocationState | null
      navigate(state?.from ?? paths.home, { replace: true })
    } catch (error) {
      if (error instanceof ApiClientError && error.violations) {
        form.setErrors({
          email: error.violations.email?.[0],
          password: error.violations.password?.[0],
        })
      }
    }
  })

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack>
        {generalError && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={18} />}
            title="Не удалось войти"
          >
            {generalError}
          </Alert>
        )}

        <TextInput
          label="Email"
          placeholder="dispatcher@example.com"
          autoComplete="email"
          autoFocus
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Пароль"
          placeholder="Ваш пароль"
          autoComplete="current-password"
          {...form.getInputProps('password')}
        />
        <Button type="submit" loading={loginMutation.isPending}>
          Войти
        </Button>
      </Stack>
    </form>
  )
}
