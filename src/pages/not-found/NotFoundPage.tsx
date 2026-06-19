import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

import { paths } from '@/app/router/paths'

export function NotFoundPage() {
  return (
    <Center mih="100vh" p="md">
      <Stack align="center">
        <Title order={1}>404</Title>
        <Text c="dimmed">Страница не найдена.</Text>
        <Button component={Link} to={paths.home}>
          Вернуться в приложение
        </Button>
      </Stack>
    </Center>
  )
}
