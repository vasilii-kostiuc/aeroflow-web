import { Button, Center, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { Link } from 'react-router'

import { paths } from '@/app/router/paths'
import { useCurrentRole } from '@/features/auth/hooks/useCurrentRole'

/** Shown instead of a screen the user's role does not cover (task 033). */
export function AccessDeniedPage() {
  const role = useCurrentRole()

  return (
    <Center py="xl">
      <Stack align="center" gap="sm" maw={420} ta="center">
        <ThemeIcon size={48} radius="xl" variant="light" color="gray">
          <IconLock size={26} />
        </ThemeIcon>
        <Title order={2}>Нет доступа</Title>
        <Text c="dimmed">
          {role === null
            ? 'У вашей учётной записи пока нет роли. Обратитесь к администратору AeroFlow.'
            : 'Этот раздел доступен только администратору.'}
        </Text>
        {role !== null && (
          <Button component={Link} to={paths.home} variant="light">
            На главную
          </Button>
        )}
      </Stack>
    </Center>
  )
}
