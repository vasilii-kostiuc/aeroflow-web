import {
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'

export function LoginPage() {
  return (
    <Stack align="center" justify="center" mih="100vh" p="md">
      <Paper withBorder shadow="sm" radius="lg" p="xl" w="100%" maw={420}>
        <Stack>
          <div>
            <Title order={2}>Вход в AeroFlow</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Авторизация будет подключена следующим вертикальным срезом.
            </Text>
          </div>

          <TextInput
            label="Email"
            placeholder="dispatcher@example.com"
            disabled
          />
          <PasswordInput label="Пароль" placeholder="Ваш пароль" disabled />
          <Button disabled>Войти</Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
