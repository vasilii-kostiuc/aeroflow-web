import {
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'

import { LoginForm } from '@/features/auth/ui/LoginForm'

export function LoginPage() {
  return (
    <Stack align="center" justify="center" mih="100vh" p="md">
      <Paper withBorder shadow="sm" radius="lg" p="xl" w="100%" maw={420}>
        <Stack>
          <div>
            <Title order={2}>Вход в AeroFlow</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Введите данные своей учётной записи.
            </Text>
          </div>

          <LoginForm />
        </Stack>
      </Paper>
    </Stack>
  )
}
